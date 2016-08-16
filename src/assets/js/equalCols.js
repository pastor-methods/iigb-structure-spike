function chunk(arr, size){
    var chunkedArr = [];
    var chunkSize = (function () {
        var leftOver = arr.length%size;
        if (!leftOver) {
            return arr.length/size;
        } else {
            return parseInt(arr.length/size) + 1;
        }
    })();
    var noOfChunks = size;
//       console.log(noOfChunks);
    var args = [];
    var addendum = [];
    for(var i=0; i<noOfChunks; i++){
        chunkedArr.push(arr.slice(i*chunkSize, (i+1)*chunkSize));
    }

    // console.log(chunkedArr)
//     console.log(chunkSize)
    for(var j=0; j<chunkedArr.length; j++){
        if (chunkedArr[j].length === chunkSize) {
            args.push(chunkedArr[j]);
        } else {
            addendum.push(chunkedArr[j]);
        }
    }

    var partialRes = zip.apply(this,args);

    if (addendum.length === 0) {
        return partialRes;
    } else {
        for (var k=0; k<addendum[0].length; k++) {
            partialRes[k].push(addendum[0][k]);
        }
        return partialRes;
    }
}

function zip() {
    var args = [].slice.call(arguments);
    var shortest = args.length === 0 ? [] : args.reduce(function (a, b) {
        return a.length < b.length ? a : b
    });

    return shortest.map(function (_, i) {
        return args.map(function (array) {
            return array[i];
        })
    });
}

    a = [0,1,2,3,4,5,6,7,8,9,10];

    b = chunk(a,3);
    console.log(b)

