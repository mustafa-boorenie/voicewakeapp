import Foundation
import React
import UIKit
import UserNotifications

@objc(AlarmScheduler)
class AlarmSchedulerModule: RCTEventEmitter {
  private let store = AlarmSchedulerStore()
  private lazy var notificationScheduler = LocalNotificationScheduler(store: store)
  private let alarmKitBridge = AlarmKitBridge.shared
  private var observersBound = false
  private var hasListeners = false

  override init() {
    super.init()
    bindObservers()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    [AlarmEventEmitterConstants.eventName]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  // MARK: - React Methods

  @objc(scheduleAlarm:resolver:rejecter:)
  func scheduleAlarm(
    _ details: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let fireDate = extractDate(from: details) else {
      reject(AlarmError.invalidArguments.code, "fireDateMs or isoDate is required", nil)
      return
    }

    let alarmId = (details["id"] as? String) ?? UUID().uuidString
    let label = details["label"] as? String
    let requireAffirmations = details["requireAffirmations"] as? Bool ?? false
    let requireGoals = details["requireGoals"] as? Bool ?? false
    let randomChallenge = details["randomChallenge"] as? Bool ?? false

    let antiCheatToken = UUID().uuidString

    let payload = TriggeredAlarmPayload(
      alarmId: alarmId,
      label: label,
      requireAffirmations: requireAffirmations,
      requireGoals: requireGoals,
      randomChallenge: randomChallenge,
      antiCheatToken: antiCheatToken
    )

    alarmKitBridge.requestAuthorization { granted in
      guard granted else {
        reject(AlarmError.authorizationDenied.code, "AlarmKit authorization was not granted", nil)
        return
      }

      self.scheduleFallback(
        alarmId: alarmId,
        date: fireDate,
        label: label,
        payload: payload,
        antiCheatToken: antiCheatToken,
        resolve: resolve,
        reject: reject
      )
    }
  }

  @objc(cancelAlarm:resolver:rejecter:)
  func cancelAlarm(
    _ alarmId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    notificationScheduler.cancelAlarm(id: alarmId)
    resolve(nil)
  }

  @objc(cancelAllAlarms:rejecter:)
  func cancelAllAlarms(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    notificationScheduler.cancelAll()
    resolve(nil)
  }

  @objc(canScheduleExactAlarms:rejecter:)
  func canScheduleExactAlarms(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(true)
  }

  @objc(getNotificationPermissionStatus:rejecter:)
  func getNotificationPermissionStatus(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().getNotificationSettings { settings in
      let status: String
      switch settings.authorizationStatus {
      case .notDetermined:
        status = "notDetermined"
      case .denied:
        status = "denied"
      case .authorized:
        status = "authorized"
      case .provisional:
        status = "provisional"
      case .ephemeral:
        status = "ephemeral"
      @unknown default:
        status = "unknown"
      }
      print("📱 getNotificationPermissionStatus returning: \(status)")
      resolve(status)
    }
  }
  
  @objc(directRequestNotificationPermission:rejecter:)
  func directRequestNotificationPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    print("🧪 DIRECT PERMISSION REQUEST TEST")
    print("🧪 Thread: \(Thread.isMainThread ? "MAIN" : "BACKGROUND")")
    
    // Force onto main thread
    DispatchQueue.main.async {
      print("🧪 Now on main thread: \(Thread.isMainThread)")
      
      let center = UNUserNotificationCenter.current()
      print("🧪 Got notification center: \(center)")
      
      print("🧪 Calling requestAuthorization...")
      center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
        print("🧪 requestAuthorization callback executed!")
        print("🧪 Granted: \(granted)")
        
        if let error = error {
          print("🧪 Error: \(error.localizedDescription)")
          reject("PERMISSION_ERROR", error.localizedDescription, error)
        } else {
          print("🧪 No error, resolving with: \(granted)")
          resolve(granted)
        }
      }
      
      print("🧪 requestAuthorization called (waiting for callback...)")
    }
  }

  @objc(openExactAlarmSettings:rejecter:)
  func openExactAlarmSettings(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let url = URL(string: UIApplication.openSettingsURLString) else {
      resolve(nil)
      return
    }
    DispatchQueue.main.async {
      UIApplication.shared.open(url, options: [:], completionHandler: nil)
      resolve(nil)
    }
  }

  @objc(ensureNotificationPermission:rejecter:)
  func ensureNotificationPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // MUST be on main thread per Apple guidelines
    DispatchQueue.main.async {
      let center = UNUserNotificationCenter.current()
      
      print("🔔 Checking notification permission status...")
      
      // Check current authorization status
      center.getNotificationSettings { settings in
        print("📋 Current notification authorization status: \(settings.authorizationStatus.rawValue)")
        
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
          print("✅ Notification permissions already granted")
          resolve(true)
          
        case .denied:
          print("❌ Notification permissions previously denied - user must enable in Settings")
          resolve(false)
          
        case .notDetermined:
          print("🔔 Requesting notification permissions (first time)...")
          print("⚠️ iOS system dialog should appear now...")
          
          // Request authorization - MUST be on main thread
          DispatchQueue.main.async {
            center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
              if let error = error {
                print("❌ Error requesting notification permissions: \(error.localizedDescription)")
                resolve(false)
                return
              }
              
              if granted {
                print("✅ User GRANTED notification permissions")
                
                // Also request AlarmKit authorization if available (iOS 17+)
                self.alarmKitBridge.requestAuthorization { alarmKitGranted in
                  if alarmKitGranted {
                    print("✅ AlarmKit authorization also granted")
                  } else {
                    print("⚠️ AlarmKit not available or denied (will use notifications)")
                  }
                }
                
                resolve(true)
              } else {
                print("❌ User DENIED notification permissions")
                resolve(false)
              }
            }
          }
          
        @unknown default:
          print("❓ Unknown authorization status")
          resolve(false)
        }
      }
    }
  }

  @objc(getScheduledAlarms:rejecter:)
  func getScheduledAlarms(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let records = store.scheduledAlarms()
    let result = records.map { record -> [String: Any] in
      [
        "id": record.id,
        "fireDateMs": record.fireDate.timeIntervalSince1970 * 1000,
        "label": record.label as Any
      ]
    }
    resolve(result)
  }

  @objc(getLastTriggeredAlarm:rejecter:)
  func getLastTriggeredAlarm(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if let payload = store.consumeTriggered() {
      resolve(payload.dictionaryRepresentation)
    } else {
      resolve(NSNull())
    }
  }

  // MARK: - Helpers

  private func bindObservers() {
    guard !observersBound else { return }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAlarmFired(_:)),
      name: AlarmSchedulerNotifications.alarmFired,
      object: nil
    )
    observersBound = true
  }

  private func extractDate(from details: NSDictionary) -> Date? {
    if let milliseconds = details["fireDateMs"] as? NSNumber {
      return Date(timeIntervalSince1970: milliseconds.doubleValue / 1000.0)
    }
    if let isoString = details["isoDate"] as? String {
      return ISO8601DateFormatter().date(from: isoString)
    }
    return nil
  }

  private func scheduleFallback(
    alarmId: String,
    date: Date,
    label: String?,
    payload: TriggeredAlarmPayload,
    antiCheatToken: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    notificationScheduler.scheduleAlarm(
      id: alarmId,
      fireDate: date,
      label: label,
      requireAffirmations: payload.requireAffirmations,
      requireGoals: payload.requireGoals,
      randomChallenge: payload.randomChallenge,
      antiCheatToken: antiCheatToken
    ) { result in
      switch result {
      case .success(let id):
        resolve(id)
      case .failure(let error):
        reject(AlarmError.scheduleFailed.code, error.localizedDescription, error)
      }
    }
  }

  @objc private func handleAlarmFired(_ notification: Notification) {
    guard hasListeners else { return }
    guard let payload = notification.userInfo?["payload"] as? [String: Any] else { return }
    sendEvent(withName: AlarmEventEmitterConstants.eventName, body: payload)
  }

}

private enum AlarmEventEmitterConstants {
  static let eventName = "alarmFired"
}

private enum AlarmError: Error {
  case invalidArguments
  case scheduleFailed
  case authorizationDenied

  var code: String {
    switch self {
    case .invalidArguments: return "E_INVALID_ARGUMENTS"
    case .scheduleFailed: return "E_SCHEDULE_FAILED"
    case .authorizationDenied: return "E_ALARMKIT_PERMISSION"
    }
  }
}

