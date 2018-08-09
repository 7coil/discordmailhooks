$smtpServer = "127.0.0.1"
$smtpFrom = "me@alexflipnote.xyz"
$smtpTo = "lepeli@discordmail.com"
$messageSubject = "Congratulations"
$messageBody = "You won a free XSS website!"

$smtp = New-Object Net.Mail.SmtpClient($smtpServer)
$smtp.Send($smtpFrom,$smtpTo,$messagesubject,$messagebody)
