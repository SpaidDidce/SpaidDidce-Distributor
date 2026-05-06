using BackendSource.DataBaseSystem;
using BackendSource.PermissionSystem;
using BackendSource.Services.APIServices;
using BackendSource.Services.task;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace BackendSource.Services.CompleteServices
{
    public class JwtService(IConfiguration configuration) : IJwtService
    {
        private readonly IConfiguration _configuration = configuration;

        public JwtResultTask GenerateAccessToken(UserTable user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.Role.RoleName),
                new Claim(JwtRegisteredClaimNames.Iat,
                    DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                    ClaimValueTypes.Integer64)
            };

            if (user.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, user.Role.RoleName));

                foreach (var permission in user.Role.RolePermissions)
                {
                    claims.Add(new Claim(CustomClaims.Permission, permission.Permission.Name));
                }
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            double expiresMinutes = 60;
            if (!double.TryParse(_configuration["Jwt:ExpiresInMinutes"], out expiresMinutes))
                expiresMinutes = 60;

            var expires = DateTime.UtcNow.AddMinutes(expiresMinutes);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expires,
                signingCredentials: creds);

            return new JwtResultTask
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expires = expires,
            };
        }
    }
}
