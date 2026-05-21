using BackendSource.DTOs;
using BackendSource.Services.APIServices;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers;

[ApiController]
[Route("[controller]")]
public class TestController(IEmailService emailService) : Controller
{
    private readonly IEmailService _emailService = emailService;

    [HttpPost("mailtest")]
    public async Task<IActionResult> EmailTest([FromBody] EmailRequest emailRequest)
    {
        await _emailService.SendEmailAsync(emailRequest.Email, "test", "test");
        return Ok();
    }
    
}