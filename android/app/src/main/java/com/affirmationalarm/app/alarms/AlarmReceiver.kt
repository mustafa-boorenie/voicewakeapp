package com.affirmationalarm.app.alarms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != ACTION_FIRE_ALARM) {
      return
    }

    val alarmId = intent.getStringExtra(EXTRA_ALARM_ID)
    val payload = Bundle().apply {
      putString("alarmId", alarmId)
      putString("label", intent.getStringExtra(EXTRA_LABEL))
      putBoolean("requireAffirmations", intent.getBooleanExtra(EXTRA_REQUIRE_AFFIRMATIONS, false))
      putBoolean("requireGoals", intent.getBooleanExtra(EXTRA_REQUIRE_GOALS, false))
      putBoolean("randomChallenge", intent.getBooleanExtra(EXTRA_RANDOM_CHALLENGE, false))
    }

    val store = AlarmStore(context)
    alarmId?.let { AlarmNotificationHelper.cancelNotification(context, it) }
    store.markTriggered(payload)
    alarmId?.let { store.remove(it) }
    AlarmEventEmitter.emitAlarmFired(Arguments.fromBundle(payload))

    AlarmNotificationHelper.showAlarmNotification(context, payload)

    val launchIntent = AlarmNotificationHelper.createLaunchIntent(context, payload)
    ContextCompat.startActivity(context, launchIntent, null)
  }

  companion object {
    const val ACTION_FIRE_ALARM = "com.affirmationalarm.app.ACTION_FIRE_ALARM"
    const val EXTRA_ALARM_ID = "extra_alarm_id"
    const val EXTRA_LABEL = "extra_label"
    const val EXTRA_REQUIRE_AFFIRMATIONS = "extra_require_affirmations"
    const val EXTRA_REQUIRE_GOALS = "extra_require_goals"
    const val EXTRA_RANDOM_CHALLENGE = "extra_random_challenge"
  }
}

