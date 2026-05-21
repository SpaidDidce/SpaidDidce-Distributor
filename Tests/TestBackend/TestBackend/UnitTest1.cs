using BackendSource.Controllers;
using BackendSource.DTOs;
using BackendSource.Services.APIServices;
using BackendSource.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace TestBackend;

public class UnitTest1
{
    [Fact]
    public async Task EmailTest_ShouldReturnOk_AndSendEmail()
    {
        var emailServiceMock = new Mock<IEmailService>();
        
        emailServiceMock.Setup(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>())).Returns(Task.CompletedTask);
        
        var controller = new TestController(emailServiceMock.Object);

        var request = new EmailRequest
        {
            Email = "test@test.com"
        };
        
        var result = await controller.EmailTest(request);
        
        Assert.IsType<OkResult>(result);
        
        emailServiceMock.Verify(x => x.SendEmailAsync("test@test.com", "test", "test"), Times.Once);
    }
}