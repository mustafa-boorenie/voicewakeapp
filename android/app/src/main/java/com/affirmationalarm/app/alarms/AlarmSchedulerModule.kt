package com.affirmationalarm.app.alarms

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.time.Instant
import java.util.UUID

class AlarmSchedulerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  private val alarmManager: AlarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  private val alarmStore = AlarmStore(reactContext)

  init {
    AlarmNotificationHelper.ensureChannel(reactContext)
    AlarmEventEmitter.register(reactContext)
  }

  override fun initialize() {
    super.initialize()
    AlarmEventEmitter.register(reactContext)
  }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    AlarmEventEmitter.unregister(reactContext)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun scheduleAlarm(details: ReadableMap, promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
        promise.reject(E_EXACT_ALARM_PERMISSION, "Exact alarm permission not granted")
        return
      }

      val alarmId = details.getString("id") ?: UUID.randomUUID().toString()
      val fireDateMs = when {
        details.hasKey("fireDateMs") -> details.getDouble("fireDateMs").toLong()
        details.hasKey("isoDate") -> Instant.parse(details.getString("isoDate")).toEpochMilli()
        else -> throw IllegalArgumentException("fireDateMs or isoDate is required")
      }

      val label = if (details.hasKey("label")) details.getString("label") else null
      val requireAffirmations = details.getBooleanSafe("requireAffirmations", false)
      val requireGoals = details.getBooleanSafe("requireGoals", false)
      val randomChallenge = details.getBooleanSafe("randomChallenge", false)

      val payload = Bundle().apply {
        putString("alarmId", alarmId)
        putString("label", label)
        putBoolean("requireAffirmations", requireAffirmations)
        putBoolean("requireGoals", requireGoals)
        putBoolean("randomChallenge", randomChallenge)
      }

      val operationIntent = Intent(reactContext, AlarmReceiver::class.java).apply {
        action = AlarmReceiver.ACTION_FIRE_ALARM
        putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
        putExtra(AlarmReceiver.EXTRA_LABEL, label)
        putExtra(AlarmReceiver.EXTRA_REQUIRE_AFFIRMATIONS, requireAffirmations)
        putExtra(AlarmReceiver.EXTRA_REQUIRE_GOALS, requireGoals)
        putExtra(AlarmReceiver.EXTRA_RANDOM_CHALLENGE, randomChallenge)
      }

      val requestCode = alarmId.hashCode()
      val operation = PendingIntent.getBroadcast(
        reactContext,
        requestCode,
        operationIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val displayIntent = PendingIntent.getActivity(
        reactContext,
        requestCode,
        AlarmNotificationHelper.createLaunchIntent(reactContext, payload),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val triggerAtMillis = fireDateMs

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(triggerAtMillis, displayIntent), operation)
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation)
      } else {
        alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, operation)
      }

      alarmStore.add(alarmId, triggerAtMillis, label)
      promise.resolve(alarmId)
    } catch (error: Exception) {
      promise.reject(E_SCHEDULE_FAILED, error.message, error)
    }
  }

  @ReactMethod
  fun cancelAlarm(alarmId: String, promise: Promise) {
    try {
      val pendingIntent = PendingIntent.getBroadcast(
        reactContext,
        alarmId.hashCode(),
        Intent(reactContext, AlarmReceiver::class.java).apply { action = AlarmReceiver.ACTION_FIRE_ALARM },
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      alarmManager.cancel(pendingIntent)
      pendingIntent.cancel()
      alarmStore.remove(alarmId)
      AlarmNotificationHelper.cancelNotification(reactContext, alarmId)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject(E_CANCEL_FAILED, error.message, error)
    }
  }

  @ReactMethod
  fun cancelAllAlarms(promise: Promise) {
    try {
      val scheduled = alarmStore.getAll()
      scheduled.forEach { id -> cancelAlarmInternal(id) }
      alarmStore.clear()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject(E_CANCEL_FAILED, error.message, error)
    }
  }

  @ReactMethod
  fun getScheduledAlarms(promise: Promise) {
    val array = Arguments.createArray()
    alarmStore.getAll().forEach { id ->
      val alarm = alarmStore.get(id)
      val map = Arguments.createMap().apply {
        putString("id", id)
        alarm?.let {
          putDouble("fireDateMs", it.triggerAtMillis.toDouble())
          it.label?.let { text -> putString("label", text) }
        }
      }
      array.pushMap(map)
    }
    promise.resolve(array)
  }

  @ReactMethod
  fun canScheduleExactAlarms(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      promise.resolve(alarmManager.canScheduleExactAlarms())
    } else {
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun openExactAlarmSettings(promise: Promise) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val uri = android.net.Uri.fromParts("package", reactContext.packageName, null)
      val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
        data = uri
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      ContextCompat.startActivity(reactContext, intent, null)
    }
    promise.resolve(null)
  }

  @ReactMethod
  fun ensureNotificationPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      promise.resolve(true)
      return
    }

    val activity = currentActivity
    if (activity == null) {
      val granted = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
      promise.resolve(granted)
      return
    }

    val granted = ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    if (granted) {
      promise.resolve(true)
    } else {
      ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_NOTIFICATIONS)
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun getLastTriggeredAlarm(promise: Promise) {
    val data = alarmStore.consumeLastTriggered()
    promise.resolve(data)
  }

  private fun cancelAlarmInternal(alarmId: String) {
    val pendingIntent = PendingIntent.getBroadcast(
      reactContext,
      alarmId.hashCode(),
      Intent(reactContext, AlarmReceiver::class.java).apply { action = AlarmReceiver.ACTION_FIRE_ALARM },
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    alarmManager.cancel(pendingIntent)
    pendingIntent.cancel()
    AlarmNotificationHelper.cancelNotification(reactContext, alarmId)
  }

  private fun ReadableMap.getBooleanSafe(key: String, defaultValue: Boolean): Boolean =
    if (hasKey(key) && !isNull(key)) getBoolean(key) else defaultValue

  companion object {
    private const val NAME = "AlarmScheduler"
    private const val REQUEST_NOTIFICATIONS = 0xAA12
    private const val E_SCHEDULE_FAILED = "E_SCHEDULE_FAILED"
    private const val E_CANCEL_FAILED = "E_CANCEL_FAILED"
    private const val E_EXACT_ALARM_PERMISSION = "E_EXACT_ALARM_PERMISSION"
  }
}

object AlarmEventEmitter {
  @Volatile
  private var reactContext: ReactApplicationContext? = null

  fun register(context: ReactApplicationContext) {
    reactContext = context
  }

  fun unregister(context: ReactApplicationContext) {
    if (reactContext == context) {
      reactContext = null
    }
  }

  fun emitAlarmFired(data: WritableMap) {
    val context = reactContext ?: return
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(EVENT_ALARM_FIRED, data)
  }

  const val EVENT_ALARM_FIRED = "alarmFired"
}

