import Foundation

struct ScheduledAlarmRecord: Codable {
  let id: String
  let fireDate: Date
  let label: String?
  let requireAffirmations: Bool
  let requireGoals: Bool
  let randomChallenge: Bool
  let antiCheatToken: String

  var payload: TriggeredAlarmPayload {
    TriggeredAlarmPayload(
      alarmId: id,
      label: label,
      requireAffirmations: requireAffirmations,
      requireGoals: requireGoals,
      randomChallenge: randomChallenge,
      antiCheatToken: antiCheatToken
    )
  }

  init(
    id: String,
    fireDate: Date,
    label: String?,
    requireAffirmations: Bool,
    requireGoals: Bool,
    randomChallenge: Bool,
    antiCheatToken: String
  ) {
    self.id = id
    self.fireDate = fireDate
    self.label = label
    self.requireAffirmations = requireAffirmations
    self.requireGoals = requireGoals
    self.randomChallenge = randomChallenge
    self.antiCheatToken = antiCheatToken
  }

  private enum CodingKeys: String, CodingKey {
    case id
    case fireDate
    case label
    case requireAffirmations
    case requireGoals
    case randomChallenge
    case antiCheatToken
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(String.self, forKey: .id)
    fireDate = try container.decode(Date.self, forKey: .fireDate)
    label = try container.decodeIfPresent(String.self, forKey: .label)
    requireAffirmations = try container.decode(Bool.self, forKey: .requireAffirmations)
    requireGoals = try container.decode(Bool.self, forKey: .requireGoals)
    randomChallenge = try container.decode(Bool.self, forKey: .randomChallenge)
    antiCheatToken = try container.decodeIfPresent(String.self, forKey: .antiCheatToken) ?? UUID().uuidString
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(id, forKey: .id)
    try container.encode(fireDate, forKey: .fireDate)
    try container.encodeIfPresent(label, forKey: .label)
    try container.encode(requireAffirmations, forKey: .requireAffirmations)
    try container.encode(requireGoals, forKey: .requireGoals)
    try container.encode(randomChallenge, forKey: .randomChallenge)
    try container.encode(antiCheatToken, forKey: .antiCheatToken)
  }
}

struct TriggeredAlarmPayload: Codable {
  let alarmId: String
  let label: String?
  let requireAffirmations: Bool
  let requireGoals: Bool
  let randomChallenge: Bool
  let antiCheatToken: String

  var dictionaryRepresentation: [String: Any] {
    [
      "alarmId": alarmId,
      "label": label as Any,
      "requireAffirmations": requireAffirmations,
      "requireGoals": requireGoals,
      "randomChallenge": randomChallenge,
      "antiCheatToken": antiCheatToken
    ]
  }

  private enum CodingKeys: String, CodingKey {
    case alarmId
    case label
    case requireAffirmations
    case requireGoals
    case randomChallenge
    case antiCheatToken
  }

  init(
    alarmId: String,
    label: String?,
    requireAffirmations: Bool,
    requireGoals: Bool,
    randomChallenge: Bool,
    antiCheatToken: String
  ) {
    self.alarmId = alarmId
    self.label = label
    self.requireAffirmations = requireAffirmations
    self.requireGoals = requireGoals
    self.randomChallenge = randomChallenge
    self.antiCheatToken = antiCheatToken
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    alarmId = try container.decode(String.self, forKey: .alarmId)
    label = try container.decodeIfPresent(String.self, forKey: .label)
    requireAffirmations = try container.decode(Bool.self, forKey: .requireAffirmations)
    requireGoals = try container.decode(Bool.self, forKey: .requireGoals)
    randomChallenge = try container.decode(Bool.self, forKey: .randomChallenge)
    antiCheatToken = try container.decodeIfPresent(String.self, forKey: .antiCheatToken) ?? UUID().uuidString
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

