# Local pilot notes encrypted-vault protocol

Established2026-10-12 IST under explicit founder authorization. Private folder: docs/pilot/notes. Entire folder ignored by Git. No participant notes are present. EFS failed with “The request is not supported”; folder attribute remains unencrypted. No BitLocker protection claim.7-Zip is not installed; no tool was downloaded.

## Verified mechanism

Native Windows/PowerShell CMS encrypted archive of a JSON notes collection, using **AES-256-CBC** content encryption (observed OID2.16.840.1.101.3.4.1.42) and an RSA3072 document-encryption certificate in the current Windows user's certificate/private-key store. Current user matches the notes-directory owner. This is a certificate-protected CMS vault, not a password-protected7z file and not whole-folder encryption. Microsoft documents the CMS encryption/decryption boundary in [Protect-CmsMessage](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/protect-cmsmessage?view=powershell-7.5).

Private artifacts: pilot-notes.cms (ciphertext) and vault-certificate.txt (certificate locator, not a private key). Both are ignored. No raw private key or password was printed/exported. Synthetic round-trip passed; explicit wrong-RSA-key decryption was rejected; plaintext test marker absent in the ciphertext file. Directory creation/EFS attempt and these cryptographic tests are the only storage mutations; no real research data, app/DB/deployment changes.

**Only the vault is approved notes storage.** Never save loose .md/.txt/.json notes, clipboard exports, decrypted files or identity maps in this unencrypted directory. All identifying research material, including consent/debrief notes, belongs inside the encrypted collection. Git-ignore prevents normal accidental additions; it does not encrypt plaintext or stop git add -f. Never force-add this folder. Check git ls-files docs/pilot/notes stays empty before every commit. Keep synthetic verification separate from pilot observations.

## Founder workflow — private console only

Use the same Windows profile in which the certificate was created. Keep the device locked when away. Do not run this in a recorded/transcribed session or share its output with chat, cloud services or this public repository. The encrypted JSON collection starts with an empty notes array and a synthetic verification marker.

To add one private note without writing plaintext to disk, run in local PowerShell from the repository:

~~~powershell
$folder = Join-Path (Get-Location) 'docs/pilot/notes'
$vault = Join-Path $folder 'pilot-notes.cms'
$locator = (Get-Content -LiteralPath (Join-Path $folder 'vault-certificate.txt') -Raw).Trim()
$certificate = Get-Item -LiteralPath ('Cert:/CurrentUser/My/' + $locator)
$collection = (Unprotect-CmsMessage -LiteralPath $vault) | ConvertFrom-Json
$hiddenNote = Read-Host 'Private note (hidden, one line)' -AsSecureString
$note = [System.Net.NetworkCredential]::new('', $hiddenNote).Password
$collection.notes = @($collection.notes) + @($note)
$plain = $collection | ConvertTo-Json -Depth 20 -Compress
$sealed = Protect-CmsMessage -To $certificate -Content $plain
$temp = Join-Path $folder 'pilot-notes.pending.cms'
Set-Content -LiteralPath $temp -Value $sealed
if ((Unprotect-CmsMessage -LiteralPath $temp).Trim() -ne $plain) {
    throw 'Encrypted-save verification failed; previous vault preserved.'
}
[System.IO.File]::Move($temp, $vault, $true)
$hiddenNote.Dispose()
Remove-Variable note,plain,collection,sealed,hiddenNote
~~~

This workflow uses transient process memory for plaintext. It does not prove that the Windows pagefile, crash dumps or screen/console capture are encrypted. No decrypted file should be saved; encrypted storage is not protection against malware or someone using the unlocked owner session. CBC CMS is a standard confidentiality envelope; this task does not claim authenticated-ciphertext tamper protection.

For review, decrypt into a variable and inspect privately in the same console; do not export plaintext or place real notes in command-line arguments/history. Re-encrypt only from memory. Archive backups/copies must remain encrypted and be included in the December10 purge. The supplied add-note workflow is documented but NOT_RUN with actual notes; synthetic initialize/decrypt/wrong-key and encrypted-save/replacement tests were executed;the original empty vault was restored.

## Key backup and recovery — READY FOR FOUNDER DRILL

Procedure reviewed2026-10-12 IST. Actual offline PFX backup/restore is NOT_EXECUTED/NOT_VERIFIED. A memory-only synthetic test of the existing certificate passed, including explicit-key decryption and actualAES-256-CBC OID; it is not evidence that an offline backup exists. No plaintext files or PFX were created by that test.

### 1. Prepare the private recovery location

Use the same owner Windows profile and a local, non-recorded PowerShell session. Choose an offline/removable backup destination outside this repository and cloud-sync folders; verify it is private and under founder control. Keep the password separately in an existing trusted password manager or a locked offline record. Do not create a plaintext password file beside the PFX, paste a password into commands/chat or commit keys. No new password manager/tool install is required. If a destination is unavailable, stop and record backup pending.

### 2. Export the encryption certificate with its private key

This uses a hidden SecureString prompt, AES256_SHA256 encryption for the PFX private key and NoClobber to preserve existing backups. [Microsoft Export-PfxCertificate reference](https://learn.microsoft.com/en-us/powershell/module/pki/export-pfxcertificate?view=windowsserver2025-ps). Run this step yourself; tooling has not exported your key.

~~~powershell
$ErrorActionPreference = 'Stop'
$folder = Join-Path (Get-Location) 'docs/pilot/notes'
$locator = (Get-Content -LiteralPath (Join-Path $folder 'vault-certificate.txt') -Raw).Trim()
$certificate = Get-Item -LiteralPath ('Cert:/CurrentUser/My/' + $locator)
if (-not $certificate.HasPrivateKey) { throw 'Owner private key unavailable; stop.' }
$backupFile = Read-Host 'Private absolute path for NEW offline PFX backup (outside repo)'
if (-not [IO.Path]::IsPathFullyQualified($backupFile)) { throw 'Absolute path required.' }
$repoRoot = [IO.Path]::GetFullPath((Get-Location).Path).TrimEnd('\') + '\'
$backupFull = [IO.Path]::GetFullPath($backupFile)
if ($backupFull.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Backup must be outside repository.'
}
if (Test-Path -LiteralPath $backupFull) { throw 'Backup already exists; preserve it.' }
$backupPassword = Read-Host 'Strong backup password (hidden; save separately)' -AsSecureString
try {
    Export-PfxCertificate -Cert $certificate -FilePath $backupFull         -Password $backupPassword -CryptoAlgorithmOption AES256_SHA256 -ChainOption EndEntityCertOnly -NoClobber | Out-Null
    if (-not (Test-Path -LiteralPath $backupFull)) { throw 'Backup missing.' }
    Write-Output 'Encrypted PFX written; recovery remains unverified until Step3.'
} finally {
    $backupPassword.Dispose()
    Remove-Variable backupPassword
}
~~~

The backup directory must already exist. Confirm the destination is offline/not synced yourself; path exclusion alone does not establish that. Disconnect/store the offline copy safely after testing. An encrypted key backup does not contain the actual note archive; encrypted note copies need separate recovery planning and remain subject to the December10 purge.

### 3. Recover a synthetic message using ONLY the backed-up private key

Use the actual backup media/PFX and its stored password. This loads the key with EphemeralKeySet, does not import/replace/delete certificates in the working store, and explicitly supplies that restored key to CMS decryption. Using Unprotect-CmsMessage alone here could silently use the original installed key and give a false recovery pass. A fresh private PowerShell session in the owner Windows profile is preferable; no deletion of the working profile/key is necessary.

~~~powershell
$ErrorActionPreference = 'Stop'
$folder = Join-Path (Get-Location) 'docs/pilot/notes'
$locator = (Get-Content -LiteralPath (Join-Path $folder 'vault-certificate.txt') -Raw).Trim()
$originalCertificate = Get-Item -LiteralPath ('Cert:/CurrentUser/My/' + $locator)
$pfxFile = Read-Host 'Private path to actual offline PFX backup'
$password = Read-Host 'Backup password (hidden)' -AsSecureString
$restored = $null
$restoredKey = $null
$pfxBytes = $null
try {
    $pfxBytes = [IO.File]::ReadAllBytes($pfxFile)
    $restored = [Security.Cryptography.X509Certificates.X509Certificate2]::new(
        $pfxBytes, $password, [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet)
    if (-not $restored.HasPrivateKey -or $restored.Thumbprint -ne $originalCertificate.Thumbprint) {
        throw 'Backup is missing the expected private key; stop.'
    }
    $synthetic = 'synthetic-only-backup-drill-' + [Guid]::NewGuid().ToString('N')
    $sealed = Protect-CmsMessage -To $originalCertificate -Content $synthetic
    $encoded = $sealed -replace '-----BEGIN CMS-----|-----END CMS-----|\s', ''
    $message = [Security.Cryptography.Pkcs.EnvelopedCms]::new()
    $message.Decode([Convert]::FromBase64String($encoded))
    if ($message.ContentEncryptionAlgorithm.Oid.Value -ne '2.16.840.1.101.3.4.1.42') {
        throw 'Unexpected encryption algorithm.'
    }
    $restoredKey = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($restored)
    $message.Decrypt($message.RecipientInfos[0], $restoredKey)
    if ([Text.Encoding]::UTF8.GetString($message.ContentInfo.Content).Trim() -ne $synthetic) {
        throw 'Recovered content mismatch.'
    }
    Write-Output 'PASS: actual offline backup recovered synthetic content; no plaintext file written.'
} finally {
    if ($null -ne $restoredKey) { $restoredKey.Dispose() }
    if ($null -ne $restored) { $restored.Dispose() }
    if ($null -ne $pfxBytes) { [Array]::Clear($pfxBytes, 0, $pfxBytes.Length) }
    $password.Dispose()
}
~~~

Wrong password/missing PFX/wrong certificate/decryption failure means FAIL, not recovery complete. Do not alter the working vault/key to troubleshoot. Record only test date, PASS/FAIL and a private evidence reference; do not send PFX, password, key, paths or real note text to chat/public Git. On success, privately confirm password retrievability and offline copy accessibility. Repeat after material backup/profile changes. This synthetic drill proves the backup key can recover a freshly encrypted message, not an independently verified whole-device disaster recovery.

### 4. Standalone no-artifact encrypt/decrypt check

This checks the existing certificate only; it is safe to run before the offline drill and does not prove backup recovery. Synthetic text/ciphertext stays in memory and the real archive is never opened or changed.

~~~powershell
$folder = Join-Path (Get-Location) 'docs/pilot/notes'
$locator = (Get-Content -LiteralPath (Join-Path $folder 'vault-certificate.txt') -Raw).Trim()
$certificate = Get-Item -LiteralPath ('Cert:/CurrentUser/My/' + $locator)
$test = 'synthetic-only-memory-check-' + [Guid]::NewGuid().ToString('N')
$ciphertext = Protect-CmsMessage -To $certificate -Content $test
if ((Unprotect-CmsMessage -Content $ciphertext).Trim() -ne $test) {
    throw 'Synthetic round-trip failed.'
}
Write-Output 'PASS: memory-only synthetic encrypt/decrypt; no plaintext artifacts.'
Remove-Variable test,ciphertext
~~~

Keep the private key while required for archive recovery. vault-certificate.txt is only a locator, not a backup. By December10,2026,purge all qualitative note archives/copies per consent; key backups must not include retained note data. Ordinary deletion is not a physical-SSD secure-erasure claim. Pagefile/crash-dump/malware/unlocked-session limits stated earlier remain.

Verification diagnostic: the initial File.Replace example with a null backup argument failed because PowerShell marshaled an empty path. No plaintext or real notes were written and the original vault remained intact. Corrected same-directory File.Move with overwrite passed the synthetic save/readback/restore test; no pending file remains.

## Temporary-key recovery simulation executed — 2026-10-12 IST

PASS:tempRSA3072 certificate,AES256_SHA256 encrypted PFX outsidecheckout,original test private key removed,ephemeral restore,explicit restored-key synthetic decrypt,wrong-key denial,no plaintext notes,unchanged founder vault and cleanup. [Evidence](evidence/PH31/RECOVERY_DRILL.md). This validates the procedure,not an actual offline backup of the founder vault key. That real-key backup/restore remains pending before research collection. No founder key export or real research processing occurred.
