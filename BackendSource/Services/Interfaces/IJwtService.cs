using BackendSource.DataBaseSystem;
using BackendSource.Services.task;

namespace BackendSource.Services.APIServices
{
    public interface IJwtService
    {
         JwtResultTask GenerateAccessToken(UserTable user);
    }
}
