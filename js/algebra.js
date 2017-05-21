
//function createAlgebra_(elems, table) {
//    let map = {};
//    table.forEach((row, i) => {
//        row.forEach((z, j) => {
//            let x = elems[i];
//            let y = elems[j];
//            if (!map[x])
//                map[x] = {};
//            map[x][y] = z;
//        });
//    });
//
//    // TODO: 
//    // check if table is valid
//    return {
//        elems, map,
//        apply(x, y) {
//            let row = map[x];
//            if (!row)
//                throw "undefined operation for ${x} and ${y}"; 
//            return map[x][y];
//        }
//    }
//}


// changes:
// 1. allow definition to consist of more than two elements
//   a + b + c = x
//
// 2. do not return  an exception when operating on an undefined parameters
//
// 3. identity is the clearing of elements

//function createAlgebra__({
//    elems= [],
//    identity = "0",
//    table = [],
//    abelian = true,
//} = {}) {
//
//    let map = {};
//    table.forEach(([x, y, z]) => {
//        console.log(">>", x, y, z);
//        if (!map[x])
//            map[x] = {};
//        map[x][y] = z;
//    });
//
//    return {
//        table,
//        abelian,
//        elems,
//        identity,
//        map,
//
//        lookup(x, y) {
//            let row = map[x];
//            if (row) {
//                return row[y];
//            }
//            return null;
//        },
//
//        apply(x, y) {
//
//            let z = this.lookup(x, y);
//            if (z != null)
//                return z;
//
//            if (this.abelian) {
//                z = this.lookup(y, x);
//            }
//
//            if (z == null)
//                throw `undefined operation for ${x} and ${y}`; 
//
//            return z;
//        }
//    }
//}
function createAlgebra({
    //elems= [],
    identity = "0",
    table = [],
    strict = false,
    abelian = true,
} = {}) {

    let SEP = "✗";
    let concat = (...args) => args.join(SEP);

    let map = {};
    let arglenSet = new Set();
    let elemSet = new Set();

    table.forEach(args => {
        args.forEach(e => elemSet.add(e));

        args = args.slice();
        let z = args.pop();
        if (abelian) {
            args.sort();
        }
        arglenSet.add(args.length);
        let k = concat(...args);
        map[k] = z;
    });
    elemSet.delete(identity);

    let elems = [];
    for (let [x] of elemSet.entries()) {
        elems.push(x);
    }
    elems.push(identity);

    let arglens = [];
    for (let [x] of arglenSet.entries()) {
        arglens.push(x);
    }

    return {
        table,
        abelian,
        elems,
        identity,
        strict,
        map,
        arglens,

        apply(...args) {
            if (this.abelian)
                args = args.sort();

            let k = concat(...args);
            let z = this.map[k];

            if (z == null && this.strict)
                throw `undefined operation for (${args})`; 

            return z;
        }
    }
}

function createAlgebra______({
    elems= [],
    identity = "0",
    table = [],
    strict = false,
    abelian = true,
} = {}) {

    let SEP = "✗";
    let concat = (...args) => args.join(SEP);

    let map = {};
    let arglenSet = new Set();

    table.forEach(args => {
        args = args.slice();
        let z = args.pop();
        if (abelian) {
            args.sort();
        }
        arglenSet.add(args.length);
        let k = concat(...args);
        map[k] = z;
    });

    let arglens = [];
    for (let [x] of arglenSet.entries()) {
        arglens.push(x);
    }

    return {
        table,
        abelian,
        elems,
        identity,
        strict,
        map,
        arglens,

        apply(...args) {
            if (this.abelian)
                args = args.sort();

            let k = concat(...args);
            let z = this.map[k];

            if (z == null && this.strict)
                throw `undefined operation for (${args})`; 

            return z;
        }
    }
}

// when commutative, sort the parameters

//let alg = createAlgebra({
//    elems: ["a", "b", "c", "0"],
//    identity: "0",
//    table: [
//        // note this could result to some ambiguity
//        ["a", "a", "b"],
//        ["a", "a", "b"],
//
//        // last element is the result
//        // a + a + a = b
//        ["a", "a", "a", "b"],
//        // a = b
//        ["a", "b"],
//
//        // a and c are inverses of each other
//        ["a", "c", "0"],
//
//    ],
//});




