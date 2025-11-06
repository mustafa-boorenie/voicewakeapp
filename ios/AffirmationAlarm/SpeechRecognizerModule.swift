import Foundation
import AVFoundation
import Speech
import React

@objc(SpeechRecognizer)
final class SpeechRecognizerModule: RCTEventEmitter {
  private enum Event {
    static let result = "SpeechRecognizer.onResult"
    static let error = "SpeechRecognizer.onError"
  }

  private let audioEngine = AVAudioEngine()
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var speechRecognizer: SFSpeechRecognizer?
  private let processingQueue = DispatchQueue(label: "com.affirmationalarm.speech.processing")

  private var recordedAudio = Data()
  private var capturedSampleRate: Double = 44_100
  private var hasListeners = false

  override init() {
    super.init()
    speechRecognizer = SFSpeechRecognizer()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    [Event.result, Event.error]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(ensurePermissions:rejecter:)
  func ensurePermissions(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    requestSpeechPermission { speechGranted in
      self.requestMicrophonePermission { micGranted in
        resolve(speechGranted && micGranted)
      }
    }
  }

  @objc(startRecognition:resolver:rejecter:)
  func startRecognition(
    _ options: NSDictionary?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      do {
        try self.startRecognitionOnMain(options: options)
        resolve(nil)
      } catch {
        reject("E_SPEECH_START", error.localizedDescription, error)
      }
    }
  }

  @objc(stopRecognition:rejecter:)
  func stopRecognition(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.stopAudioSession()
    }

    processingQueue.async {
      let audioBase64 = self.recordedAudio.base64EncodedString()
      let result: [String: Any] = [
        "audioBase64": audioBase64,
        "sampleRate": self.capturedSampleRate
      ]

      self.recordedAudio = Data()
      resolve(result)
    }
  }

  @objc(cancelRecognition:rejecter:)
  func cancelRecognition(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.recognitionTask?.cancel()
      self.stopAudioSession()
      resolve(nil)
    }
  }

  // MARK: - Private

  private func startRecognitionOnMain(options: NSDictionary?) throws {
    guard recognitionTask == nil else {
      throw SpeechRecognizerError.sessionInProgress
    }

    let language = options?["language"] as? String
    if let language {
      speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: language))
    } else if speechRecognizer == nil {
      speechRecognizer = SFSpeechRecognizer()
    }

    guard let speechRecognizer, speechRecognizer.isAvailable else {
      throw SpeechRecognizerError.recognizerUnavailable
    }

    recordedAudio = Data()

    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(.record, mode: .measurement, options: [.duckOthers, .allowBluetooth])
    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    recognitionRequest?.shouldReportPartialResults = true

    recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest!) { result, error in
      if let result {
        self.handleRecognition(result: result)
        if result.isFinal {
          self.finishRecognitionSession()
        }
      }

      if let error {
        self.emitError(error)
        self.finishRecognitionSession()
      }
    }

    let inputNode = audioEngine.inputNode
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    capturedSampleRate = recordingFormat.sampleRate

    inputNode.removeTap(onBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 2048, format: recordingFormat) { buffer, _ in
      self.recognitionRequest?.append(buffer)
      self.captureAudioSamples(buffer: buffer)
    }

    audioEngine.prepare()
    try audioEngine.start()
  }

  private func finishRecognitionSession() {
    DispatchQueue.main.async {
      self.recognitionRequest?.endAudio()
      self.recognitionTask = nil
      self.recognitionRequest = nil
    }
  }

  private func stopAudioSession() {
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionRequest?.endAudio()
    recognitionTask = nil
    recognitionRequest = nil

    do {
      try AVAudioSession.sharedInstance().setActive(false)
    } catch {
      emitError(error)
    }
  }

  private func handleRecognition(result: SFSpeechRecognitionResult) {
    guard hasListeners else { return }

    let transcript = result.bestTranscription.formattedString
    let confidence = result.transcriptions.first.map { transcription -> Double in
      let segments = transcription.segments
      guard !segments.isEmpty else { return 0.0 }
      let total = segments.reduce(0.0) { $0 + $1.confidence }
      return Double(total) / Double(segments.count)
    } ?? 0.0

    sendEvent(withName: Event.result, body: [
      "transcript": transcript,
      "isFinal": result.isFinal,
      "confidence": confidence
    ])
  }

  private func captureAudioSamples(buffer: AVAudioPCMBuffer) {
    guard let channelData = buffer.floatChannelData else { return }
    let frameLength = Int(buffer.frameLength)
    guard frameLength > 0 else { return }

    let samples = UnsafeBufferPointer(start: channelData.pointee, count: frameLength)
    processingQueue.async {
      guard let baseAddress = samples.baseAddress else { return }
      let sampleData = Data(bytes: baseAddress, count: frameLength * MemoryLayout<Float>.size)
      self.recordedAudio.append(sampleData)
    }
  }

  private func emitError(_ error: Error) {
    guard hasListeners else { return }
    sendEvent(withName: Event.error, body: [
      "message": error.localizedDescription
    ])
  }

  private func requestSpeechPermission(completion: @escaping (Bool) -> Void) {
    switch SFSpeechRecognizer.authorizationStatus() {
    case .authorized:
      completion(true)
    case .denied, .restricted:
      completion(false)
    case .notDetermined:
      SFSpeechRecognizer.requestAuthorization { status in
        DispatchQueue.main.async {
          completion(status == .authorized)
        }
      }
    @unknown default:
      completion(false)
    }
  }

  private func requestMicrophonePermission(completion: @escaping (Bool) -> Void) {
    let session = AVAudioSession.sharedInstance()
    session.requestRecordPermission { granted in
      DispatchQueue.main.async {
        completion(granted)
      }
    }
  }
}

private enum SpeechRecognizerError: Error, LocalizedError {
  case sessionInProgress
  case recognizerUnavailable

  var errorDescription: String? {
    switch self {
    case .sessionInProgress:
      return "A recognition session is already in progress."
    case .recognizerUnavailable:
      return "Speech recognizer is currently unavailable."
    }
  }
}

