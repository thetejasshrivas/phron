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

## Key recovery — pending founder action before real notes

The local private key is necessary for decryption; vault-certificate.txt alone cannot recover it. Before collecting data, use Windows Current User certificate management to export this document-encryption certificate **with its private key** into a strongly password-protected PFX backup. Choose the password privately, never in chat/command arguments. Keep the encrypted backup securely offline and separate from notes; do not commit it or upload it. Confirm a synthetic restore/decrypt in an appropriate private recovery environment without overwriting the working certificate. Certificate/key backup and restore are **NOT_VERIFIED** by this task. Do not reset/delete the Windows profile or certificate while notes remain needed.

By December10,2026, purge all qualitative data and encrypted note copies per consent. Do not claim physical secure erasure on an SSD from ordinary deletion. Key-recovery material must not retain copies of qualitative note data.

Verification diagnostic: the initial File.Replace example with a null backup argument failed because PowerShell marshaled an empty path. No plaintext or real notes were written and the original vault remained intact. Corrected same-directory File.Move with overwrite passed the synthetic save/readback/restore test; no pending file remains.
