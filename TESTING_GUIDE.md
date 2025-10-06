# Security Testing Guide - Admin Password Reset

## 🧪 Test Status: Ready for Testing

**Date**: October 6, 2025  
**Feature**: Secure Admin Password Reset with Multi-Layer Security  
**Database Rules**: ✅ Deployed Successfully

---

## 📋 Pre-Test Checklist

- [x] Firebase Database Rules deployed
- [x] Security layers implemented
- [x] Activity logging configured
- [x] Rate limiting added
- [ ] Test admin account credentials ready
- [ ] Test non-admin account ready
- [ ] Email client open for verification

---

## 🔐 Security Test Cases

### Test 1: ✅ Valid Admin Password Reset

**Objective**: Verify admin can successfully request password reset

**Steps**:
1. Log in as admin user
2. Navigate to: Admin Dashboard → Settings
3. Scroll to "Change Password" section
4. Enter new password: `TestPass123!`
5. Confirm password: `TestPass123!`
6. Click "Change Password"

**Expected Results**:
- ✅ Success toast: "Password reset email sent! Please check your inbox."
- ✅ Info toast: "You will be logged out in 3 seconds..."
- ✅ Automatically logged out after 3 seconds
- ✅ Redirected to `/login` page
- ✅ Email received within 1-2 minutes
- ✅ Activity log created in Firebase Database

**Verify in Firebase Console**:
```
Database → activityLogs → [latest timestamp]
{
  action: "password_reset_requested",
  userId: "admin_uid_here",
  userEmail: "admin@example.com",
  role: "admin",
  timestamp: 1696594800000,
  ipAddress: "client-initiated"
}
```

**Status**: [ ] Pass [ ] Fail

---

### Test 2: ❌ Non-Admin Access Prevention

**Objective**: Verify non-admin users cannot access password reset

**Steps**:
1. Create/use a customer or agent account
2. Try to navigate to admin settings (if accessible)
3. Look for password change functionality

**Expected Results**:
- ❌ Non-admin should not see admin settings page
- ❌ If they somehow access it, role check should block request
- ❌ Error toast: "Unauthorized: Only admins can change their password here."
- ❌ No email sent
- ❌ Security alert logged in console

**Status**: [ ] Pass [ ] Fail

---

### Test 3: ⏱️ Rate Limiting (60-Second Cooldown)

**Objective**: Verify rate limiting prevents spam attempts

**Steps**:
1. Log in as admin
2. Navigate to Settings → Change Password
3. Enter valid passwords
4. Click "Change Password" (1st attempt)
5. **Immediately** enter new passwords again
6. Click "Change Password" (2nd attempt within 60 seconds)

**Expected Results**:
- ✅ 1st attempt: Success (email sent)
- ❌ 2nd attempt: Error toast with countdown
- ❌ Message: "⏳ Please wait XX seconds before trying again."
- ❌ No second email sent
- ✅ After 60 seconds, can try again

**Status**: [ ] Pass [ ] Fail

---

### Test 4: 🔍 Database Role Verification

**Objective**: Verify server-side role check from database

**Steps**:
1. Log in as admin
2. Open Browser DevTools → Console
3. Manually change client-side role:
   ```javascript
   // In browser console
   const authStore = JSON.parse(localStorage.getItem('auth-storage'));
   authStore.state.role = 'customer';
   localStorage.setItem('auth-storage', JSON.stringify(authStore));
   location.reload();
   ```
4. Try to request password reset

**Expected Results**:
- ❌ Request should fail (database check overrides client)
- ❌ Error: "Unauthorized: Admin role required."
- ❌ Security alert in console
- ❌ No email sent
- ✅ Activity log shows failed attempt

**Status**: [ ] Pass [ ] Fail

---

### Test 5: 🔒 User Identity Match

**Objective**: Verify user UID matching prevents session hijacking

**Steps**:
1. Log in as admin
2. Note the user UID from Firebase Auth
3. In DevTools console, modify the stored user UID:
   ```javascript
   const authStore = JSON.parse(localStorage.getItem('auth-storage'));
   authStore.state.user.uid = 'fake-uid-12345';
   localStorage.setItem('auth-storage', JSON.stringify(authStore));
   ```
4. Try password reset without reloading

**Expected Results**:
- ❌ Error: "Security error: User mismatch detected."
- ❌ No email sent
- ❌ Security alert logged

**Status**: [ ] Pass [ ] Fail

---

### Test 6: ✉️ Email Link Password Reset

**Objective**: Verify email link works and password changes successfully

**Prerequisites**: Complete Test 1 first

**Steps**:
1. Check email inbox (and spam folder)
2. Open password reset email from Firebase
3. Click "Reset Password" link
4. Enter new password on Firebase page
5. Confirm new password
6. Submit the form
7. Navigate back to login page
8. Try logging in with:
   - Old password (should fail)
   - New password (should succeed)

**Expected Results**:
- ✅ Email received within 2 minutes
- ✅ Link opens Firebase password reset page
- ✅ New password accepted (min 6 characters)
- ✅ Success message shown
- ❌ Old password no longer works
- ✅ New password works correctly
- ✅ Can access admin dashboard

**Status**: [ ] Pass [ ] Fail

---

### Test 7: ⚠️ Invalid Input Validation

**Objective**: Test client-side validation

**Test 7a: Password Too Short**
- Enter password: `123` (less than 6 chars)
- Expected: ❌ Error "New password must be at least 6 characters long"

**Test 7b: Passwords Don't Match**
- New password: `ValidPass123`
- Confirm password: `DifferentPass456`
- Expected: ❌ Error "New passwords do not match"

**Test 7c: Empty Fields**
- Leave fields empty
- Click "Change Password"
- Expected: ❌ Browser validation error (required fields)

**Status**: [ ] Pass [ ] Fail

---

### Test 8: 📝 Activity Logging - Failed Attempts

**Objective**: Verify failed attempts are logged

**Steps**:
1. Trigger any failed scenario (e.g., rate limiting)
2. Open Firebase Console
3. Navigate to: Database → activityLogs
4. Find the failed attempt entry

**Expected Results**:
```json
{
  action: "password_reset_failed",
  userId: "admin_uid",
  userEmail: "admin@example.com",
  role: "admin",
  error: "auth/too-many-requests",
  timestamp: 1696594800000
}
```

**Status**: [ ] Pass [ ] Fail

---

### Test 9: 🚫 Unauthenticated Access

**Objective**: Verify logged-out users cannot access

**Steps**:
1. Log out completely
2. Try to navigate to `/admin/settings` directly
3. Or try to access password reset endpoint

**Expected Results**:
- ❌ Redirected to login page
- ❌ Cannot access admin settings
- ❌ No password reset functionality available

**Status**: [ ] Pass [ ] Fail

---

### Test 10: 🌐 Multiple Browser Sessions

**Objective**: Test behavior across multiple sessions

**Steps**:
1. Log in as admin in Browser 1 (Chrome)
2. Log in as same admin in Browser 2 (Firefox)
3. Request password reset in Browser 1
4. Check if Browser 2 session is affected

**Expected Results**:
- ✅ Password reset works in Browser 1
- ✅ Browser 1 logs out after 3 seconds
- ⚠️ Browser 2 may stay logged in (Firebase behavior)
- ✅ After password change, Browser 2 should require re-login on next request

**Status**: [ ] Pass [ ] Fail

---

## 🐛 Bug Tracking

### Bugs Found:

| Bug ID | Severity | Description | Status |
|--------|----------|-------------|--------|
| - | - | - | - |

---

## 📊 Test Results Summary

**Total Tests**: 10  
**Passed**: ___  
**Failed**: ___  
**Blocked**: ___  
**Pass Rate**: ___%

---

## 🔍 Manual Testing Notes

### Test Environment:
- **Date**: _____________
- **Tester**: _____________
- **Browser**: _____________
- **Firebase Project**: msspecial-e-commerce

### Observations:

```
[Add your testing observations here]
```

---

## ✅ Production Readiness Checklist

After all tests pass:

- [ ] All 10 security tests passed
- [ ] Activity logs working correctly
- [ ] Rate limiting functioning as expected
- [ ] Email delivery confirmed
- [ ] No console errors
- [ ] Firebase rules deployed
- [ ] Documentation reviewed
- [ ] Team trained on new flow
- [ ] Monitoring set up for activityLogs
- [ ] Backup admin account tested

---

## 🚀 Quick Test Commands

### Check Activity Logs (Firebase Console):
1. Go to: https://console.firebase.google.com/project/msspecial-e-commerce
2. Realtime Database → activityLogs
3. Sort by timestamp (descending)

### Monitor in Real-Time:
```javascript
// In browser console (admin only)
firebase.database().ref('activityLogs')
  .limitToLast(10)
  .on('child_added', (snapshot) => {
    console.log('New activity:', snapshot.val());
  });
```

### Clear Rate Limit (for testing only):
```javascript
// In browser console
localStorage.removeItem('lastPasswordResetAttempt');
// Or wait 60 seconds
```

---

## 📞 Support

**Issues Found?** 
- Check browser console for error messages
- Verify Firebase Database Rules are deployed
- Check spam folder for reset emails
- Review activityLogs for clues

**Need Help?**
- Review: `SECURITY_IMPLEMENTATION.md`
- Check: Firebase Console → Authentication
- Verify: Database rules syntax

---

## 🎯 Next Steps After Testing

1. **If All Tests Pass**:
   - ✅ Mark feature as production-ready
   - ✅ Train other admins
   - ✅ Update user documentation
   - ✅ Set up monitoring alerts

2. **If Tests Fail**:
   - ❌ Document issues in Bug Tracking table
   - ❌ Create GitHub issues
   - ❌ Fix and re-test
   - ❌ Do NOT deploy to production

---

**Ready to Start Testing?**

1. Open your app: http://localhost:5173 (or production URL)
2. Follow Test 1 first
3. Then proceed through Tests 2-10
4. Document results in each section
5. Report findings

Good luck! 🚀🔒

