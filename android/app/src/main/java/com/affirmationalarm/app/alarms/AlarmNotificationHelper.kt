package com.affirmationalarm.app.alarms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.affirmationalarm.app.MainActivity
import com.affirmationalarm.app.R

object AlarmNotificationHelper {
  private const val CHANNEL_ID = "affirmation-alarm-channel"
  private const val CHANNEL_NAME = "Alarm"
  private const val NOTIFICATION_ID = 0xA11

  fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val existing = manager.getNotificationChannel(CHANNEL_ID)
    if (existing == null) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        enableLights(true)
        enableVibration(true)
        description = "Wake-up alarms"
      }
      manager.createNotificationChannel(channel)
    }
  }

  fun createLaunchIntent(context: Context, payload: Bundle): Intent {
    return Intent(context, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtras(payload)
      putExtra(EXTRA_LAUNCHED_BY_ALARM, true)
    }
  }

  fun showAlarmNotification(context: Context, payload: Bundle) {
    ensureChannel(context)
    val alarmId = payload.getString("alarmId") ?: "alarm"
    val label = payload.getString("label") ?: "Affirmation Alarm"
    val launchIntent = createLaunchIntent(context, payload)
    val pendingIntent = PendingIntent.getActivity(
      context,
      alarmId.hashCode(),
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher)
      .setColor(ContextCompat.getColor(context, R.color.notification_icon_color))
      .setContentTitle(label)
      .setContentText("Time to speak your affirmations and goals")
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setFullScreenIntent(pendingIntent, true)
      .setAutoCancel(false)
      .setOngoing(true)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setVibrate(longArrayOf(0, 500, 500, 500))
      .build()

    with(NotificationManagerCompat.from(context)) {
      notify(alarmId, NOTIFICATION_ID, notification)
    }
  }

  fun cancelNotification(context: Context, alarmId: String) {
    NotificationManagerCompat.from(context).cancel(alarmId, NOTIFICATION_ID)
  }

  const val EXTRA_LAUNCHED_BY_ALARM = "launchedByAlarm"
}

