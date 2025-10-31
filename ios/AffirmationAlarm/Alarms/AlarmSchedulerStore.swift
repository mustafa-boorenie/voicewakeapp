import Foundation

struct ScheduledAlarmRecord: Codable {
  let id: String
  let fireDate: Date
  let label: String?
  let requireAffirmations: Bool
  let requireGoals: Bool
  let randomChallenge: Bool

  var payload: TriggeredAlarmPayload {
    TriggeredAlarmPayload(
      alarmId: id,
      label: label,
      requireAffirmations: requireAffirmations,
      requireGoals: requireGoals,
      randomChallenge: randomChallenge
    )
  }
}

struct TriggeredAlarmPayload: Codable {
  let alarmId: String
  let label: String?
  let requireAffirmations: Bool
  let requireGoals: Bool
  let randomChallenge: Bool

  var dictionaryRepresentation: [String: Any] {
    [
      "alarmId": alarmId,
      "label": label as Any,
      "requireAffirmations": requireAffirmations,
      "requireGoals": requireGoals,
      "randomChallenge": randomChallenge
    ]
  }
}

final class AlarmSchedulerStore {
  private let userDefaults: UserDefaults

  private let scheduledKey = "alarm.scheduler.scheduled"
  private let triggeredKey = "alarm.scheduler.triggered"

  init(userDefaults: UserDefaults = .standard) {
    self.userDefaults = userDefaults
  }

  func save(record: ScheduledAlarmRecord) {
    var records = loadScheduled()
    records.removeAll { $0.id == record.id }
    records.append(record)
    persist(records: records)
  }

  func remove(alarmId: String) {
    var records = loadScheduled()
    records.removeAll { $0.id == alarmId }
    persist(records: records)
  }

  func removeAll() {
    userDefaults.removeObject(forKey: scheduledKey)
  }

  func scheduledAlarms() -> [ScheduledAlarmRecord] {
    return loadScheduled()
  }

  func markTriggered(payload: TriggeredAlarmPayload) {
    if let data = try? JSONEncoder().encode(payload) {
      userDefaults.set(data, forKey: triggeredKey)
    }
  }

  func consumeTriggered() -> TriggeredAlarmPayload? {
    guard let data = userDefaults.data(forKey: triggeredKey) else { return nil }
    userDefaults.removeObject(forKey: triggeredKey)
    return try? JSONDecoder().decode(TriggeredAlarmPayload.self, from: data)
  }

  // MARK: - Private

  private func loadScheduled() -> [ScheduledAlarmRecord] {
    guard let data = userDefaults.data(forKey: scheduledKey) else { return [] }
    return (try? JSONDecoder().decode([ScheduledAlarmRecord].self, from: data)) ?? []
  }

  private func persist(records: [ScheduledAlarmRecord]) {
    if let data = try? JSONEncoder().encode(records) {
      userDefaults.set(data, forKey: scheduledKey)
    }
  }
}

