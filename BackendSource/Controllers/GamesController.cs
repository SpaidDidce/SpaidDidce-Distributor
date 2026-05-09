using BackendSource.Security;
using BackendSource.Services.APIServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class GamesController(IGameService games, IKeyService keyService) : Controller
    {
        private readonly IGameService _games = games;
        private readonly IKeyService _keyService = keyService;

        [Authorize]
        [GameKey]
        [HttpGet("/games/{id}/latest/download")]
        public async Task<IActionResult> DownloadLatest(Guid id)
        {
            var game = await _games.GetLatestVersion(id);

            if (game == null)
                return NotFound();

            var path = Path.Combine($"GameFiles/{game.GameId}", game.FileName);

            var stream = System.IO.File.OpenRead(path);

            return PhysicalFile(path, "application/zip", game.FileName);
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
