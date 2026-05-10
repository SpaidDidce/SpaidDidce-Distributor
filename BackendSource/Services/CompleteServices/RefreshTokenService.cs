using BackendSource.DataBaseSystem;
using BackendSource.DataBaseSystem.JwtAndRefreshTokens;
using BackendSource.RTH;
using BackendSource.Services.Interfaces;
using BackendSource.Services.task;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace BackendSource.Services.CompleteServices
{
    public class RefreshTokenService(DbContextBa context) : IRefreshTokenService
    {

        private readonly DbContextBa _context = context;

        public async Task<RefreshTokenResult> GetRefreshTokenFromDB(string refreshTokenHashed)
        {
            var refreshTokenDb = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == refreshTokenHashed && !x.Revoked && x.ExpiresAt > DateTime.UtcNow);
            if (refreshTokenDb == null)
            {
                return RefreshTokenResult.Fail("Refresh token doesnt exist");
            }

            return RefreshTokenResult.Success(refreshTokenDb);
        }

        public async Task<RefreshNewTokenResult> NewToken(string refreshToken)
        {
            var RefreshTokenHashed = RefreshTokenHasher.Hash(refreshToken);

            var refreshTokenDb = await _context.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == RefreshTokenHashed && !x.Revoked && x.ExpiresAt > DateTime.UtcNow);
            if (refreshTokenDb == null)
            {
                return RefreshNewTokenResult.Fail("Error");
            }

            refreshTokenDb.Revoked = true;

            var user = await _context.Users.FindAsync(refreshTokenDb.UserId);
            if (user == null)
                return RefreshNewTokenResult.Fail("No user find");

            var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = RefreshTokenHasher.Hash(newRefreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            });

            await _context.SaveChangesAsync();
            return RefreshNewTokenResult.Success(newRefreshToken);
        }

        public async Task<string> RefreshToken(UserTable user)
        {
            var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            var tokenHash = RefreshTokenHasher.Hash(refreshToken);
            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                TokenHash = tokenHash,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });

            await _context.SaveChangesAsync();

            return refreshToken;
        }

        public async Task<string> RevokeAndGenerateNew(string oldRefreshTokenFromClient)
        {
            var oldTokenDb = await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.TokenHash == oldRefreshTokenFromClient && !x.Revoked && x.ExpiresAt > DateTime.UtcNow);

            if (oldTokenDb == null)
                throw new InvalidOperationException("Refresh token inválido");

            oldTokenDb.Revoked = true;

            var newRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = oldTokenDb.UserId,
                TokenHash = RefreshTokenHasher.Hash(newRefreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });

            await _context.SaveChangesAsync();
            return newRefreshToken;
        }
    }
}
