import Foundation

#if canImport(AlarmKit)
import AlarmKit
#endif

final class AlarmKitBridge {
  static let shared = AlarmKitBridge()

  func requestAuthorization(completion: @escaping (Bool) -> Void) {
#if canImport(AlarmKit)
    if #available(iOS 17.0, *), #available(iOS 15.0, *) {
      Task {
        do {
          let manager = AlarmManager.shared
          let state = try await manager.requestAuthorization()
          let description = String(describing: state).lowercased()
          let granted = description.contains("authorized") || description.contains("full")
          DispatchQueue.main.async {
            completion(granted)
          }
        } catch {
          DispatchQueue.main.async {
            completion(false)
          }
        }
      }
    } else {
      DispatchQueue.main.async {
        completion(true)
      }
    }
#else
    completion(true)
#endif
  }

  func isAvailable() -> Bool {
#if canImport(AlarmKit)
    if #available(iOS 17.0, *) {
      return true
    }
#endif
    return false
  }
}

