# Testing the New Alarm Screen Design

## How to Test

1. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Run on iOS simulator:**
   ```bash
   npm run ios
   ```

3. **Run on Android:**
   ```bash
   npm run android
   ```

## What to Test

### CreateAlarmScreen (New Alarm)
1. ✅ Navigate to "Add Alarm" from home screen
2. ✅ Check if days selector shows MON-SUN with numbers 3-9
3. ✅ Verify gradient card displays correctly (pink → lavender → cyan)
4. ✅ Test time inputs - should show purple large text
5. ✅ Toggle vibration switch
6. ✅ Select number of snoozes (0-3 buttons)
7. ✅ Tap "Save Alarm" button (purple with bell icon)
8. ✅ Check bottom navigation displays correctly

### EditAlarmScreen (Edit Existing Alarm)
1. ✅ Tap on existing alarm from home screen
2. ✅ Verify same modern design as CreateAlarmScreen
3. ✅ Check alarm toggle on gradient card works
4. ✅ Test Delete button (red with trash icon)
5. ✅ Verify Save Changes button works

### Expected Behavior
- **Colors**: Purple theme throughout (#7C3AED)
- **Gradient Card**: Smooth pink-lavender-cyan gradient
- **Icons**: Emoji icons visible (🔔 🕐 📳 🔊 ⏰)
- **Layout**: Clean white cards on light gray background
- **Typography**: Bold headings, clear hierarchy
- **Shadows**: Subtle shadows on cards and buttons
- **Responsiveness**: All elements properly sized

## Known Limitations
1. **Alarm Sound Dropdown**: Shows "Gentle Chime" but not functional yet
2. **Snooze Length Dropdown**: Shows value but not editable dropdown yet
3. **Settings Tab**: Navigation exists but screen not implemented
4. **Label Editing**: Edit alarm label in hidden field (not on gradient card yet)

## Troubleshooting

### If gradient doesn't show:
- Check `expo-linear-gradient` is installed
- Try: `npx expo install expo-linear-gradient`
- Rebuild app if needed

### If layout looks broken:
- Clear cache: `npx expo start -c`
- Reinstall node modules: `rm -rf node_modules && npm install`

### If navigation doesn't work:
- Check AppNavigator includes CreateAlarm and EditAlarm routes
- Verify navigation prop is passed correctly

## Screenshots to Take
1. Days selector at top
2. Gradient alarm card
3. Time input section (large purple numbers)
4. Snooze options section
5. Bottom navigation bar
6. Full screen overview

## Success Criteria
✅ Modern purple design matches Figma
✅ All interactions work smoothly
✅ No crashes or errors
✅ Alarm functionality preserved
✅ Data saves correctly to database

