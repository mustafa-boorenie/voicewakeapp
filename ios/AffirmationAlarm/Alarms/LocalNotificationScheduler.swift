import Foundation
import UserNotifications

final class LocalNotificationScheduler {
  private let center = UNUserNotificationCenter.current()
  private let store: AlarmSchedulerStore

  init(store: AlarmSchedulerStore) {
    self.store = store
  }

  func scheduleAlarm(
    id: String,
    fireDate: Date,
    label: String?,
    requireAffirmations: Bool,
    requireGoals: Bool,
    randomChallenge: Bool,
    completion: @escaping (Result<String, Error>) -> Void
  ) {
    let content = UNMutableNotificationContent()
    content.title = label ?? "Affirmation Alarm"
    content.body = "Time to speak your affirmations and goals"
    content.sound = UNNotificationSound.default
    content.userInfo = [
      "alarmId": id,
      "label": label as Any,
      "requireAffirmations": requireAffirmations,
      "requireGoals": requireGoals,
      "randomChallenge": randomChallenge
    ]

    let triggerDate = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: fireDate)
    let trigger = UNCalendarNotificationTrigger(dateMatching: triggerDate, repeats: false)
    let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)

    center.add(request) { error in
      if let error = error {
        completion(.failure(error))
      } else {
        let record = ScheduledAlarmRecord(
          id: id,
          fireDate: fireDate,
          label: label,
          requireAffirmations: requireAffirmations,
          requireGoals: requireGoals,
          randomChallenge: randomChallenge
        )
        self.store.save(record: record)
        completion(.success(id))
      }
    }
  }

  func cancelAlarm(id: String, completion: (() -> Void)? = nil) {
    center.removePendingNotificationRequests(withIdentifiers: [id])
    store.remove(alarmId: id)
    completion?()
  }

  func cancelAll(completion: (() -> Void)? = nil) {
    center.removeAllPendingNotificationRequests()
    store.removeAll()
    completion?()
  }
}

