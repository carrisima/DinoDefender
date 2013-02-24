
var DinoAnimationGroupName = "dinoPlayer";
var DinoAnimationSequences = {
    run_right: {
        frames: _.range(27,35),
        rate: 1/10,
        next: 'stand_right'
    },

    run_left: {
        frames: _.range(9,16),
        rate: 1/10,
        next: 'stand_left'
    },

    fire: {
        frames: _.range(18,26),
        next: 'stand_left',
        rate: 1/10
    },

    stand_right: {
        frames: [2,3],
        rate: 1/2,
        loop: true
    },

    stand_left: {
        frames: [0,1],
        rate: 1/2,
        loop: true
    },

    hop_up: {
        frames: _.range(20,23),
        rate: 1/5
    },

    zapped: {
        frames: [4],
        rate: 1/5
    }
};

var SmokeAnimationGroupName = "smoke";
var SmokeAnimationSequences = {
    explode: {
        frames: _.range(0,7),
        rate: 1/10,
        loop: false
    }
};

var UFOAnimationGroupName = "ufo";
var UFOAnimationSequences = {
    fly: {
        frames: [0,1],
        rate: 1/10,
        loop: true
    },
    flame: {
        frames: _.range(0,3),
        rate: 1/10,
        loop: true
    }
};

var BombAnimationGroupName = "daBomb";
var BombAnimationSequences = {
    twirl: {
        frames: _.range(0,4),
        rate: 1/10,
        loop: true
    }

};