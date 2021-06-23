var time_fractions = function(human_time) {
    var minutes = human_time % 100;
    var hours = (human_time - minutes) / 100;
    hours += minutes / 60;
    return hours;
};

class MarineVectorsCurrent {
    constructor(idx, time_from, time_to, current_direction, current_speed)
    {
        this.idx = idx
        this.time_from = time_from
        this.time_to = time_to
        this.current_direction = current_direction
        this.current_speed = current_speed
    }
    getTimeInterval()
    {
        var start_time = time_fractions(this.time_from)
        var end_time = time_fractions(this.time_to)
        return end_time - start_time
    }
    getCurrentVectorDirection()
    {
        return this.current_direction
    }
    getCurrentVectorDistance()
    {
        return this.getTimeInterval() * this.current_speed
    }
    updateTimeFrom(new_time)
    {
        this.time_from = new_time
    }
    updateTimeTo(new_time)
    {
        this.time_to = new_time
    }
    updateCurrentDirection(new_direction)
    {
        this.current_direction = new_direction
    }
    updateCurrentSpeed(new_speed)
    {
        this.current_speed = new_speed
    }
}

class MarineVectorsWind {
    constructor(idx, time_from, time_to, wind_direction, wind_speed, leeway_data)
    {
        this.idx = idx
        this.time_from = time_from
        this.time_to = time_to
        this.wind_direction_from = parseInt(wind_direction)
        this.wind_speed = wind_speed
        this.leeway_data = leeway_data
    }
    getWindDirectionTo()
    {
        return (this.wind_direction_from + 180) % 360;
    }
    updateWindDirectFrom(new_direction)
    {
        this.wind_direction_from = parseInt(new_direction)
    }
    updateWindSpeed(new_speed)
    {
        this.wind_speed = parseInt(new_speed)
    }
    getLeewayRate()
    {
        return (this.wind_speed * this.leeway_data.multiplier) + this.leeway_data.modifier;
    }
    getTimeInterval()
    {
        var start_time = time_fractions(this.time_from)
        var end_time = time_fractions(this.time_to)
        return end_time - start_time
    }
    getWindVectorDirection()
    {
        return this.getWindDirectionTo()
    }
    getWindVectorDistance()
    {
        return this.getTimeInterval() * this.getLeewayRate()
    }
}

class MarineVectors {
    constructor(leeway_data) {
        this.current_vectors = []
        this.wind_vectors = []
        this.leeway_data = leeway_data
    }
    getResultingVector()
    {
        var bearing = 0;
        var distance = 0;
        for (var idx in this.current_vectors)
        {
            var curr_vector = this.current_vectors[idx]
            if (bearing == 0 && distance == 0)
            {
                bearing = curr_vector.getCurrentVectorDirection()
                distance = curr_vector.getCurrentVectorDistance()
            }
            else
            {
                /* do trig to work out the resulting vector */
                var x1 = distance * Math.cos(bearing * Math.PI / 180);
                var y1 = distance * Math.sin(bearing * Math.PI / 180);
                var curr_bearing = curr_vector.getCurrentVectorDirection();
                var curr_distance = curr_vector.getCurrentVectorDistance();
                var x2 = curr_distance * Math.cos(curr_bearing * Math.PI / 180);
                var y2 = curr_distance * Math.sin(curr_bearing * Math.PI / 180);
                var x = x1 + x2;
                var y = y1 + y2;
                distance = Math.sqrt(x * x + y * y);
                bearing = Math.atan(y/x) * 180 / Math.PI;
            }
        }
        for (var idx in this.wind_vectors)
        {
            var wind_vector = this.wind_vectors[idx]
            if (bearing == 0 && distance == 0)
            {
                bearing = wind_vector.getWindVectorDirection()
                distance = wind_vector.getWindVectorDistance()
            }
            else
            {
                /* do trig to work out the resulting vector */
                var x1 = distance * Math.cos(bearing * Math.PI / 180);
                var y1 = distance * Math.sin(bearing * Math.PI / 180);
                var wind_bearing = wind_vector.getWindVectorDirection();
                var wind_distance = wind_vector.getWindVectorDistance();
                var x2 = wind_distance * Math.cos(wind_bearing * Math.PI / 180);
                var y2 = wind_distance * Math.sin(wind_bearing * Math.PI / 180);
                var x = x1 + x2;
                var y = y1 + y2;
                distance = Math.sqrt(x * x + y * y);
                bearing = Math.atan(y/x) * 180 / Math.PI;
            }
        }
        bearing = (bearing + 360) % 360;
        return { 'bearing': bearing, 'distance': distance }
    }
    addCurrentVector()
    {
        let current_vector = new MarineVectorsCurrent(this.current_vectors.length + 1, 0, 0, 0, 0)
        this.current_vectors.push(current_vector)
        return current_vector
    }
    addWindVector()
    {
        let wind_vector = new MarineVectorsWind(this.wind_vectors.length + 1, 0, 0, 0, 0, this.leeway_data)
        this.wind_vectors.push(wind_vector)
        return wind_vector
    }
    recalculate()
    {
        for (var idx in this.current_vectors)
        {
            var curr_vector = this.current_vectors[idx]
            var cvc = curr_vector.idx
            curr_vector.time_from = $("#curr_time_start_" + cvc).val()
            curr_vector.time_to = $("#curr_time_end_" + cvc).val()
            curr_vector.current_direction = $("#curr_direction_" + cvc).val()
            curr_vector.current_speed = $("#curr_speed_" + cvc).val()
            $("#curr_time_interval_" + cvc).text(curr_vector.getTimeInterval())
            $("#curr_vector_degrees_" + cvc).text(curr_vector.getCurrentVectorDirection())
            $("#curr_vector_distance_" + cvc).text(curr_vector.getCurrentVectorDistance())
        }
        for (var idx in this.wind_vectors)
        {
            var wind_vector = this.wind_vectors[idx]
            var wvc = wind_vector.idx
            wind_vector.time_from = $("#wind_time_start_" + wvc).val()
            wind_vector.time_to = $("#wind_time_end_" + wvc).val()
            wind_vector.updateWindDirectFrom($("#wind_from_direction_" + wvc).val())
            wind_vector.updateWindSpeed($("#wind_speed_" + wvc).val())
            $("#wind_leeway_direction_" + wvc).text(wind_vector.getWindDirectionTo())
            $("#wind_leeway_rate_" + wvc).text(wind_vector.getLeewayRate())
            $("#wind_time_interval_" + wvc).text(wind_vector.getTimeInterval())
            $("#wind_vector_degrees_" + wvc).text(wind_vector.getWindVectorDirection())
            $("#wind_vector_distance_" + wvc).text(wind_vector.getWindVectorDistance())
        }
        var results = this.getResultingVector()
        $("#tdv_result_direction").text(Math.round(results['bearing']))
        $("#tdv_result_distance").text(results['distance'].toFixed(2))
    }

    newCurrentVector()
    {
        var curr_vector = this.addCurrentVector()
        var cvc = curr_vector.idx
        $('#current_vectors').append('<tr>' +
            '<td><input type="number" minlength="4" maxlength="4" id="curr_time_start_' + cvc + '" name="curr_time_start_' + cvc + '" /></td>' +
            '<td><input type="number" minlength="4" maxlength="4" id="curr_time_end_' + cvc + '" name="curr_time_end_' + cvc + '" /></td>' +
            '<td><input type="number" minlength="3" maxlength="3" max="360" id="curr_direction_' + cvc + '" name="curr_direction_' + cvc + '" /></td>' +
            '<td><input type="number" minlength="1" maxlength="3" id="curr_speed_' + cvc + '" name="curr_speed_' + cvc + '" /></td>' +
            '<td id="curr_time_interval_' + cvc + '">0.0</td>' +
            '<td id="curr_vector_degrees_' + cvc + '">000</td>' +
            '<td id="curr_vector_distance_' + cvc + '">0</td>' +
        '</tr>')
        var vectors = this;
        $("#curr_time_start_" + cvc).change(function()
        {
            vectors.recalculate();
        })
        $("#curr_time_end_" + cvc).change(function()
        {
            vectors.recalculate();
        })
        $("#curr_direction_" + cvc).change(function()
        {
            vectors.recalculate();
        })
        $("#curr_speed_" + cvc).change(function()
        {
            vectors.recalculate();
        })
    }

    newWindVector()
    {
        var wind_vector = vectors.addWindVector()
        var wvc = wind_vector.idx
        $('#wind_vectors').append('<tr>' +
            '<td><input type="number" minlength="4" maxlength="4" id="wind_time_start_' + wvc + '" name="wind_time_start_' + wvc + '" /></td>' +
            '<td><input type="number" minlength="4" maxlength="4" id="wind_time_end_' + wvc + '" name="wind_time_end_' + wvc + '" /></td>' +
            '<td><input type="number" minlength="3" maxlength="3" max="360" id="wind_from_direction_' + wvc + '" name="wind_from_direction_' + wvc + '" /></td>' +
            '<td><input type="number" minlength="1" maxlength="3" id="wind_speed_' + wvc + '" name="wind_speed_' + wvc + '" /></td>' +
            '<td id="wind_leeway_direction_' + wvc + '">000</td>' +
            '<td id="wind_leeway_rate_' + wvc + '">0</td>' +
            '<td id="wind_time_interval_' + wvc + '">0.0</td>' +
            '<td id="wind_vector_degrees_' + wvc + '">000</td>' +
            '<td id="wind_vector_distance_' + wvc + '">0</td>' +
        '</tr>')
        $("#wind_time_start_" + wvc).change(function()
        {
            vectors.recalculate();
        })
        $("#wind_time_end_" + wvc).change(function()
        {
            vectors.recalculate();
        })
        $("#wind_from_direction_" + wvc).change(function()
        {
            vectors.recalculate();
        })
        $("#wind_speed_" + wvc).change(function()
        {
            vectors.recalculate();
        })
    }
}