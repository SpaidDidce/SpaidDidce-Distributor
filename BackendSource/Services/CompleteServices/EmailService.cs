using BackendSource.Services.Interfaces;
using BackendSource.SMTPSystem;
using MailKit.Security;
using MimeKit;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;

namespace BackendSource.Services.CompleteServices;

public class EmailService(IOptions<SmtpSettings> smtpSettings) : IEmailService
{
    private readonly SmtpSettings _smtpSettings = smtpSettings.Value;
    
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var email = new MimeMessage();
        
        email.From.Add(MailboxAddress.Parse(_smtpSettings.From));
        email.To.Add(MailboxAddress.Parse(to));
        
        email.Subject = subject;

        email.Body = new TextPart("html")
        {
            Text = body
        };

        using var smtp = new SmtpClient();
        
        var secureSocket = _smtpSettings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;

        await smtp.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, secureSocket);
        
        await smtp.SendAsync(email);

        await smtp.DisconnectAsync(true);
        Console.WriteLine("Mail sent");
    }
}