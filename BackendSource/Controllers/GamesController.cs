using BackendSource.DataBaseSystem;
using BackendSource.DTOs;
using BackendSource.PermissionSystem;
using BackendSource.Systems;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Semver;
using System.Runtime.Intrinsics.X86;

namespace BackendSource.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class GamesController(GamesSystem games) : Controller
    {

        private readonly GamesSystem _games = games;

        [Authorize(Policy = PolicyNames.Tester)]
        [HttpGet("/games/{id}/latest/download")]
        public async Task<IActionResult> DownloadLatest(Guid id)
        {
            var game = await _games.GetLatestVersion(id);

            if (game == null)
                return NotFound();

            var path = Path.Combine("GameFiles", game.FileName);

            var stream = System.IO.File.OpenRead(path);

            return File(stream, "application/zip", game.FileName);
        }

        [HttpGet("/games/{id}/latest/description")]
        public async Task<IActionResult> Description(Guid id)
        {
            var game = await _games.GetLastVersionDesc(id);
            if (game == null)
                return NotFound();

            return Ok(game);
        }


    }
}
