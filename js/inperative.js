
function tweener(sprite, ts, speed, easing) {
    let tween = game.add.tween(sprite);
    tween.to(ts, speed, easing);

    let ctrl = {
        start: () => {
            tween.start();
            tween.onComplete.add(() => {
                if (ctrl.done)
                    ctrl.done();
            });
        },
        stop: () => {
            tween.stop();
            if (ctrl.done)
                ctrl.done();
        }
    }
    return ctrl;
}

function sequence(...actions) {
    if (actions.length == 0)
        return {start: () => {}};

    let i = 0;
    let mainCtrl;

    let cc = () => {
        if (i >= actions.length) {
            if (mainCtrl.done)
                mainCtrl.done();
            return;
        }

        let fn = actions[++i];
        if (typeof fn == "function") {
            let ctrl = fn();
            if (ctrl && typeof ctrl.start == "function") {
                ctrl.start();
                ctrl.done = cc;
            } else {
                setTimeout(cc);
                //console.log("invalid action in sequence:", ctrl);
            }
        } else {
            setTimeout(cc);
            //console.log("not a function in sequence: ", fn);
        }
    }

    mainCtrl = {
        start: () => {
            let ctrl = actions[i]();
            if (!ctrl || typeof ctrl !== "object") {
                setTimeout(cc);
                return;
            }
            ctrl.done = cc;
            if (!ctrl.start)
                cc();
            else
                ctrl.start();
        },
    }
    return mainCtrl;
}

function parallel(...actions) {
    let i = 0;
    let mainCtrl;

    let count = 0;
    let cc = () => {
        count++;

        if (count >= actions.length) {
            if (mainCtrl.done)
                mainCtrl.done();
            return;
        }

    }

    mainCtrl = {
        start: () => {
            actions.forEach(fn => {
                if (typeof fn == "function") {
                    let ctrl = fn();
                    if (ctrl && typeof ctrl.start == "function") {
                        ctrl.start();
                        ctrl.done = cc;
                    } else {
                        setTimeout(cc);
                        //console.log("invalid action in sequence:", ctrl);
                    }
                } else {
                    setTimeout(cc);
                    //console.log("not a function in sequence: ", fn);
                }
            });
        },
    }
    return mainCtrl;
}

function doWhile(cond, ...actions) {
    let ctrl = {
        start: () => {
            let xxx = sequence(...actions);
            xxx.done = () => {
                if (cond())
                    setTimeout(ctrl.start);
                else if (ctrl.done)
                    ctrl.done();
            }
            xxx.start();
        }
    }
    return ctrl;
}

function wait(ms=1000) {
    let ctrl = {
        start: () => {
            setTimeout(() => {
                if (ctrl.done)
                    ctrl.done();
            }, ms);
        },
    }
    return ctrl;
}

function loop(cond, body) {
    let ctrl = {
        start: () => {
            let id = setTimeout(() => {
                if (cond()) {
                    body();
                } else {
                    clearTimeout(id);
                    if (ctrl.done)
                        ctrl.done();
                }
            });
        }
    }
    return ctrl;
}

