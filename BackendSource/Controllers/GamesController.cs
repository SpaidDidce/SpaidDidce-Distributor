using Amazon.S3;
using Amazon.S3.Model;
using BackendSource.Security;
using BackendSource.Services.APIServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class GamesController(IGameService games, IKeyService keyService, IAmazonS3 s3, IConfiguration configuration) : Controller
    {
        private readonly IGameService _games = games;
        private readonly IKeyService _keyService = keyService;
        private readonly IAmazonS3 _s3 = s3;
        private readonly IConfiguration _configuration = configuration;

        [Authorize]
        [GameKey]
        [HttpGet("/games/{id}/latest/download")]
        public async Task<IActionResult> DownloadLatest(Guid id)
        {
            var game = await _games.GetLatestVersion(id);

            if (game == null)
                return NotFound();
            
            bool useS3 = _configuration.GetValue<bool>("UseS3");
            if (!useS3)
            {
                var path = Path.GetFullPath(Path.Combine("GameFiles", game.GameId.ToString(), game.FileName));
                if (!System.IO.File.Exists(path))
                {
                    return NotFound("El archivo fisico no existe en el servidor.");
                } 
                
                return PhysicalFile(path, "application/zip", game.FileName);
            }

            var bucketName = "game-files";
            var key = $"{game.GameId}/{game.FileName}";

            var request = new GetPreSignedUrlRequest
            {
                BucketName = bucketName,
                Key = key,
                Expires = DateTime.UtcNow.AddMinutes(10)
            };

            var url = _s3.GetPreSignedURL(request);

            return Ok(new { url });
        }

        [Authorize]
        [GameKey]
        [HttpGet("/games/{id}/latest/description")]
        public async Task<IActionResult> Description(Guid id)
        {
            var game = await _games.GetLastVersionDesc(id);
            if (game == null)
                return NotFound();

            return Ok(game);
        }

        [Authorize]
        [HttpGet("/games")]
        public async Task<IActionResult> GetGames()
        {
            var games = await _games.GetAllPublicGames();
            if (games == null)
                return NotFound();

            return Ok(games);
        }

        [Authorize]
        [HttpPost("/games/searchbyname")]
        public async Task<IActionResult> searchbyname([FromBody] DTOs.GamesDtos.SearchGameDto dto)
        {
            var games = await _games.GetGameFromName(dto.gameName);
            if (games == null)
                return NotFound();

            return Ok(games);
        }
    }
}
