# Microsoft Store MSIX Submission

Use this checklist when preparing a real Microsoft Store submission.

## 1. Reserve the app in Partner Center

Create or reserve the app name in Microsoft Partner Center first. Copy the package identity values from the product setup/package identity page.

Update `Package.appxmanifest` so these values match Partner Center exactly:

- `Identity Name`
- `Identity Publisher`
- `Properties PublisherDisplayName`
- `Properties DisplayName`, if the Store listing name differs

The current manifest uses development placeholder identity values:

```xml
<Identity
  Name="com.focusbuddy.app"
  Publisher="CN=FocusBuddy"
  Version="0.1.0.0" />
```

## 2. Build an unsigned Store package

Microsoft Store signs MSIX packages during submission, so use the Store build script:

```powershell
npm run pack:msix:store
```

This creates:

```text
FocusBuddy_Store_x64.msix
```

Upload that package in Partner Center.

## 3. Local testing package

For local install testing, use the signed development package instead:

```powershell
npm run msix:cert
npm run pack:msix
npm run msix:install-cert
Add-AppxPackage .\com.focusbuddy.app_0.1.0.0_x64.msix
```

The `devcert.pfx` file is development-only and must not be uploaded or committed.

## 4. Before submitting

- Increment `Identity Version` for every Store update.
- Confirm the backend API points to production, not localhost.
- Confirm OAuth redirect URLs and deep links work in the packaged app.
- Test the sidecar binary from the installed MSIX.
- Run Windows App Certification Kit if available.
- Add clear certification notes if the app requires login or test credentials.
