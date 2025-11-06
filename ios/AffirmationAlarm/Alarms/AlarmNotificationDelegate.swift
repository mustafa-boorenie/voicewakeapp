import Foundation
import UserNotifications

final class AlarmNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  static let shared = AlarmNotificationDelegate()

  private let store = AlarmSchedulerStore()

  func configure() {
    UNUserNotificationCenter.current().delegate = self
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    handle(notification: notification)
    completionHandler([.sound, .banner, .list])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    handle(notification: response.notification)
    completionHandler()
  }

  private func handle(notification: UNNotification) {
    guard let payload = TriggeredAlarmPayload(userInfo: notification.request.content.userInfo) else { return }
    store.markTriggered(payload: payload)
    store.remove(alarmId: payload.alarmId)
    NotificationCenter.default.post(
      name: AlarmSchedulerNotifications.alarmFired,
      object: nil,
      userInfo: ["payload": payload.dictionaryRepresentation]
    )
  }
}

private extension TriggeredAlarmPayload {
  init?(userInfo: [AnyHashable: Any]) {
    guard let alarmId = userInfo["alarmId"] as? String else { return nil }
    let label = userInfo["label"] as? String
    let requireAffirmations = userInfo["requireAffirmations"] as? Bool ?? false
    let requireGoals = userInfo["requireGoals"] as? Bool ?? false
    let randomChallenge = userInfo["randomChallenge"] as? Bool ?? false
    let antiCheatToken = userInfo["antiCheatToken"] as? String ?? UUID().uuidString
    self.init(
      alarmId: alarmId,
      label: label,
      requireAffirmations: requireAffirmations,
      requireGoals: requireGoals,
      randomChallenge: randomChallenge,
      antiCheatToken: antiCheatToken
    )
  }
}

