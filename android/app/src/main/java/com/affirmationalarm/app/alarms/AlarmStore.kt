package com.affirmationalarm.app.alarms

import android.content.Context
import android.os.Bundle
import androidx.core.content.edit
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import org.json.JSONObject

class AlarmStore(context: Context) {
  private val appContext = context.applicationContext
  private val prefs = appContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

  fun add(id: String, triggerAtMillis: Long, label: String?) {
    val ids = prefs.getStringSet(KEY_IDS, emptySet())!!.toMutableSet()
    ids.add(id)
    val record = JSONObject().apply {
      put("triggerAt", triggerAtMillis)
      put("label", label)
    }
    prefs.edit {
      putStringSet(KEY_IDS, ids)
      putString(keyForId(id), record.toString())
    }
  }

  fun remove(id: String) {
    val ids = prefs.getStringSet(KEY_IDS, emptySet())!!.toMutableSet()
    if (!ids.remove(id)) return
    prefs.edit {
      putStringSet(KEY_IDS, ids)
      remove(keyForId(id))
    }
  }

  fun clear() {
    val ids = prefs.getStringSet(KEY_IDS, emptySet()) ?: emptySet()
    val editor = prefs.edit()
    ids.forEach { editor.remove(keyForId(it)) }
    editor.remove(KEY_IDS)
    editor.apply()
  }

  fun getAll(): Set<String> = prefs.getStringSet(KEY_IDS, emptySet()) ?: emptySet()

  fun get(id: String): AlarmMetadata? {
    val json = prefs.getString(keyForId(id), null) ?: return null
    val record = JSONObject(json)
    val label = if (record.has("label") && !record.isNull("label")) record.getString("label") else null
    return AlarmMetadata(
      triggerAtMillis = record.optLong("triggerAt"),
      label = label
    )
  }

  fun markTriggered(bundle: Bundle) {
    val payload = JSONObject().apply {
      put("alarmId", bundle.getString("alarmId"))
      put("label", bundle.getString("label"))
      put("requireAffirmations", bundle.getBoolean("requireAffirmations"))
      put("requireGoals", bundle.getBoolean("requireGoals"))
      put("randomChallenge", bundle.getBoolean("randomChallenge"))
    }
    prefs.edit {
      putString(KEY_LAST_TRIGGERED, payload.toString())
    }
  }

  fun consumeLastTriggered(): WritableMap? {
    val json = prefs.getString(KEY_LAST_TRIGGERED, null) ?: return null
    prefs.edit { remove(KEY_LAST_TRIGGERED) }
    val payload = JSONObject(json)
    val bundle = Bundle().apply {
      putString("alarmId", payload.optString("alarmId", null))
      putString("label", payload.optString("label", null))
      putBoolean("requireAffirmations", payload.optBoolean("requireAffirmations"))
      putBoolean("requireGoals", payload.optBoolean("requireGoals"))
      putBoolean("randomChallenge", payload.optBoolean("randomChallenge"))
    }
    return Arguments.fromBundle(bundle)
  }

  data class AlarmMetadata(val triggerAtMillis: Long, val label: String?)

  private fun keyForId(id: String) = "alarm:$id"

  companion object {
    private const val PREF_NAME = "alarm_scheduler_store"
    private const val KEY_IDS = "ids"
    private const val KEY_LAST_TRIGGERED = "last_triggered"
  }
}

