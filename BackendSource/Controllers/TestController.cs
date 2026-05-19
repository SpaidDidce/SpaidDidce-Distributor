using BackendSource.DTOs;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers;

[ApiController]
[Route("[controller]")]
public class TestController(IEmailService emailServices) : Controller
{
    private readonly IEmailService _emailService = emailServices;
    
    [HttpPost("mailtest")]
    public async Task<IActionResult> EmailTest([FromBody] EmailRequest request)
    {
        Console.WriteLine("Testing email");
        await _emailService.SendEmailAsync(request.Email, "test", "test");
        return Ok();
    }
}