function deg_to_dm(degs, lat)
{
    var dir = '';
    if (degs < 0)
    {
        degs = degs * -1;
        dir = lat ? 'S' : 'W';
    }
    else
    {
        dir = lat ? 'N' : 'E';
    }
    var d = Math.floor(degs);
    var mins = ((degs-d)*60).toFixed(3);

    return d + ' ' + mins + ' ' + dir;
}

function dm_to_deg(dm_str)
{
    var parts = dm_str.split(' ');
    var d = parseInt(parts[0]);
    var mins = parseFloat(parts[1]);
    var dir = parts[2];
    var dec = mins / 60;
    var degs = d + dec;
    if (dir === 'S' || dir === 'W')
    {
        degs = degs * -1;
    }
    return degs;
}
