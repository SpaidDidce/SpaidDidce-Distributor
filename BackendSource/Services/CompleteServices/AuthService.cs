using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.JwtAndRefreshTokens;
using BackendSource.DTOs;
using BackendSource.RTH;
using BackendSource.Services.APIServices;
using BackendSource.Services.Interfaces;
using BackendSource.Services.task;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BackendSource.Services.CompleteServices
{
    public class AuthService(DbContextBa contextBa, IPasswordHasher<UserTable> passHasher, IJwtService jwtService, IRefreshTokenService RefreshService) : IAuthService
    {
        private readonly DbContextBa _context = contextBa;
        private readonly IPasswordHasher<UserTable> _passHasher = passHasher;
        private readonly IJwtService _jwtService = jwtService;
        private readonly IRefreshTokenService _IRefreshService = RefreshService;

        public async Task<UserTask> GetUser(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return UserTask.Fail("Doesnt Exist user");

            return UserTask.Success(user);
        }

        public async Task<LoginServiceTask> Login(LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
                return LoginServiceTask.OnFailed();

            var result = _passHasher.VerifyHashedPassword(
                user, user.HashedPassword, dto.Password);

            if (result == PasswordVerificationResult.Failed)
                return LoginServiceTask.OnFailed();

            var jwt = _jwtService.GenerateAccessToken(user);
            var RefreshToken = await _IRefreshService.RefreshToken(user);


            return LoginServiceTask.OnSuccess(jwt.Token, RefreshToken);
        }

        public async Task<RefreshToken> Logout(string refreshToken)
        {
            var tokenHash = RefreshTokenHasher.Hash(refreshToken);

            var rt = await _context.RefreshTokens
                .FirstOrDefaultAsync(x =>
                    x.TokenHash == tokenHash &&
                    !x.Revoked);

            if (rt != null)
            {
                rt.Revoked = true;
                await _context.SaveChangesAsync();
            }

            return rt;
        }

        public async Task<RegisterServiceTask> Register(RegisterDto dto)
        {
            var exists = await _context.Users
                 .AnyAsync(u => u.UserName == dto.UserName.Trim() ||
                                u.Email == dto.Email.Trim().ToLowerInvariant());

            if (exists)
                return RegisterServiceTask.OnFailed("User Exist");

            var userRole = await _context.RoleTables.FirstOrDefaultAsync(r => r.RoleName == "User");

            if (userRole == null)
                throw new Exception("Default role 'User' not found");

            var newUser = new UserTable()
            {
                UserName = dto.UserName.Trim(),
                Email = dto.Email.Trim().ToLowerInvariant(),
                CreatedAt = DateTime.UtcNow,
                RoleId = userRole.Id,
                HashedPassword = _passHasher.HashPassword(null!, dto.Password)
            };


            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            var jwt = _jwtService.GenerateAccessToken(newUser);
            var RefreshToken = await _IRefreshService.RefreshToken(newUser);
            return RegisterServiceTask.OnSuccess(newUser, jwt.Token, RefreshToken);
        }
    }
}
