#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'ios/AffirmationAlarm.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first
alarms_group = project.main_group['AffirmationAlarm']['Alarms']

# Add AlarmSchedulerBridge.m
bridge_file = alarms_group.new_file('AffirmationAlarm/Alarms/AlarmSchedulerBridge.m')
target.add_file_references([bridge_file])

# Add SpeechRecognizerModule.swift
speech_module = project.main_group['AffirmationAlarm'].new_file('AffirmationAlarm/SpeechRecognizerModule.swift')
target.add_file_references([speech_module])

# Add SpeechRecognizerBridge.m
speech_bridge = project.main_group['AffirmationAlarm'].new_file('AffirmationAlarm/SpeechRecognizerBridge.m')
target.add_file_references([speech_bridge])

# Add AlarmKitBridge.swift
alarmkit_bridge = alarms_group.new_file('AffirmationAlarm/Alarms/AlarmKitBridge.swift')
target.add_file_references([alarmkit_bridge])

project.save

puts "✅ Successfully added bridge files to Xcode project"


