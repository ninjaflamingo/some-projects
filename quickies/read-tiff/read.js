
const toArrayBuffer = (myBuf) => {
    let myBuffer = new ArrayBuffer(myBuf.length);
    let res = new Uint8Array(myBuffer);
    for (let i = 0; i < myBuf.length; ++i) {
       res[i] = myBuf[i];
    }
    return myBuffer;
 }

 const checkEndianness = (i1, i2) => {
    let endianness = false;
    if(i1 === 73 && i2 === 73){ 
        endianness = true;
    }else if(i1 === 49 && i2 === 49){
        endianness = false;
    }else{
        console.log('err');
    }
    return endianness;
};


const fs = require('fs');
const data = fs.readFileSync('density.tiff');
let arrayBuffer = toArrayBuffer(data);

const parseDataTypes = (dt) => {
    switch(dt) {
        case 1:
            return {
                decimalValue: 1,
                name: 'BYTE',
                description: '8-bit unsigned integer'
            };
        case 2:
            return {
                decimalValue: 2,
                name: 'ASCII',
                description: '8-bit, NULL-terminated string'
            };
        case 3:
            return {
                decimalValue: 3,
                name: 'SHORT',
                description: '16-bit unsigned integer'
            };
        case 4:
            return {
                decimalValue: 4,
                name: 'LONG',
                description: '32-bit unsigned integer'
            };
        case 5:
            return {
                decimalValue: 5,
                name: 'RATIONAL',
                description: 'Two 32-bit unsigned integers'
            };
        default:
      }
    return dt; 
}


const parseTags = (tag) => {
    
    switch(tag) {
        case 256: 
            return 'imageWidth';
        case 257:
            return 'imageLength';
        case 258:
            return 'bitsPerSample';
        case 259:
            return 'compression';
        case 262:
            return 'photometricInterpretation';
        case 266:
            return 'fillOrder';
        case 269:
            return 'documentName';
        case 270:
            return 'imageDescription';
        case 273:
            return 'stripOffsets';
        case 274:
            return 'orientation';
        case 277:
            return 'samplesPerPixel';
        case 278:
            return 'rowsPerStrip';
        case 279:
            return 'stripByteCounts';
        case 282:
            return 'xResolution';
        case 283:
            return 'yResolution';
        case 284:
            return 'planarConfiguration';
        case 296:
            return 'resolutionUnit';
        case 305:
            return 'software';
        case 338:
            return 'extraSamples';
        default:
      }
    return; 
}



class Tiff {
    constructor(ab){
        this.document = new DataView(ab);
        this.header = {};
        this.metaData = {};
        this.setHeader(this.document, ab.byteLength); 
    }

    setHeader(dataview, length){
        let i1 = dataview.getUint8(0);                          // 8-bit | 1 byte value
        let i2 = dataview.getUint8(1);                          // 8-bit | 1 byte value
        let endianness = checkEndianness(i1, i2);               // 'II' = Intel, 'MM' = Motorola encoding 
        let version = dataview.getUint16(2, endianness);        // 16-bit number 42 by convention 
        let documentStarts = dataview.getUint32(4, endianness); // 32-bit number which points to first ifd 

        this.header = {                                         // construct a virtual header object 
            endianness: endianness,                             // true if Intel, false if Motorola 
            version: version,                                   // version 
            documentStarts: documentStarts,                     // pointer to first IFD 
            documentEnds: length                                // the overall datalength 
        };
        return;
    };

    readAscii(offset, count, endianness){                       // func(@Number, @Number, @Boolean)
        let d = '';                                             // reads in ASCII Bytes in range specified by byte offset (offset) 
        for(var i = 0; i < count; i++){                         // and data length (count) (1 decimal = 1 byte)
            let chunk = this.document.getUint8(offset+i, endianness);
            d += String.fromCharCode(chunk);
        }
        return d;
    }

    readRational(offset, endianness){
        let chunk = this.document.getUint32(offset, endianness);
        let chunk2 = this.document.getUint32(offset+4, endianness);
        return chunk/chunk2; // returns value in DPI 
    }

    readShort(offset, count, endianness){
        let d = [];
        for(var i = 0; i < count; i++){
            let chunk = this.document.getUint16(offset + i*2, endianness);
            d.push(chunk)
        }
        return d;
    }

    readLong(offset, count, endianness){
        let d = [];
        for(var i = 0; i < count; i++){
            let chunk = this.document.getUint32(offset+i*4, endianness);
            d.push(chunk)
        }
        return d;
    }


    parseIfdEntries(){
        let { endianness, documentStarts } = this.header;
        let count = this.document.getUint16(documentStarts, endianness);  
        let ifds = {};

        var shift = 0;
        for(var i = 0; i < count; i++){

            let tag = this.document.getUint16(documentStarts+2+shift, endianness); 
            let dataType = parseDataTypes(this.document.getUint16(documentStarts+4+shift, endianness));    // will return an object {}
            let dataLength = this.document.getUint32(documentStarts+6+shift, endianness);
            let data = this.document.getUint32(documentStarts+10+shift, endianness); // if the data is too large to fit in the tag, we get a pointer to it 


            if(data > 65535 && dataType.name === 'ASCII'){ 
                let offset = data;
                let asc = this.readAscii(offset, dataLength, endianness);
                data = asc;
            }else if(data > 65535 && dataType.name === 'RATIONAL'){
                let offset = data;
                data = this.readRational(offset, endianness);
            }else if(data > 65535 && dataType.name === 'SHORT'){
                let offset = data;
                data = this.readShort(offset, dataLength, endianness);
            }else if(data > 65535 && dataType.name === 'LONG'){
                let offset = data;
                data = this.readLong(offset, dataLength, endianness);
            }

            ifds[parseTags(tag)] = {
                dataType: {
                    name: dataType.name,
                    decimalValue: dataType.decimalValue,
                    description: dataType.description
                }, 
                dataLength: dataLength,
                data: data
            };

            shift += 12;

        }
        this.metaData = ifds;
    }



}

let t = new Tiff(arrayBuffer);
t.parseIfdEntries();
console.log(`
            Planar Configuration: ${JSON.stringify(t.metaData.planarConfiguration)}` +
            /*

            If the image data is separated into planes (PlanarConguration = 2), 
            StripOffsets contains a 2D array of values which is SamplesPerPixel in width

            In this case SamplesPerPixel is 4, 
                - SamplesPerPixel is 1 for bilevel, grayscale, and palette color images
                - SamplesPerPixel is 3 for RGB images.
                - If this value is higher, ExtraSamples should give an indication of the
                meaning of the additional channels.

            1 = Chunky format. The component values for each pixel are stored contiguously. 
            For example, for RGB data, the data is stored as RGBRGBRGB
            2 = Planar format. The components are stored in separate component planes. 
            For example, RGB data is stored with the Red components in one component 
            plane, the Green in another, and the Blue in another.

            The samples are stored in separate "sample planes." The values in StripOffsets 
            and StripByteCounts are then arranged as a 2-dimensional array, 
            with SamplesPerPixel rows and StripsPerImage columns.

            All of  the columns  for row  0 are  stored first,
            followed   by    the   columns    of   row   1,   and   so   on.)
            PhotometricInterpretation describes  the type  of  data  that  is
            stored in  each sample  plane.   For example,  RGB data is stored
            with the  Red samples  in one sample plane, the Green in another,
            and the Blue in another.

            If SamplesPerPixel  is 1,  PlanarConfiguration is irrelevant, and
            should not be included.
            
            */
            `
            SamplesPerPixel: ${JSON.stringify(t.metaData.samplesPerPixel)}`+
            /* ExtraSamples: Specifies that each pixel has N extra components whose interpretation
            is defined by one of the values listed below. For example, full-color RGB data normally
            has SamplesPerPixel=3. If SamplesPerPixel is greater than 3, then the ExtraSamples field
            describes the meaning of the extra samples. If SamplesPerPixel is, say, 5 then 
            ExtraSamples will contain 2 values, one for each extra sample. ExtraSamples is typically
            used to include non-color information, such as opacity, in an image. The possible values
            for each item in the field's value are:

            0 = Unspecified data
            1 = Associated alpha data (with pre-multiplied color)
            2 = Unassociated alpha data

            LibTiff defines these values:

            EXTRASAMPLE_UNSPECIFIED = 0;
            EXTRASAMPLE_ASSOCALPHA = 1;
            EXTRASAMPLE_UNASSALPHA = 2;

            */
            `
            ExtraSamples: ${JSON.stringify(t.metaData.extraSamples)}
            StripOffsets: ${JSON.stringify(t.metaData.stripOffsets)}
            RowsPerStrip: ${JSON.stringify(t.metaData.rowsPerStrip)}` +     
            /*  indicates the number of rows of compressed bitmapped data found in each strip 
            
            StripsInImage = floor((ImageLength * (RowsPerStrip - 1)) / RowsPerStrip);

            
            */  `
            StripByteCounts: ${JSON.stringify(t.metaData.stripByteCounts)}
            
            ImageLength: ${JSON.stringify(t.metaData.imageLength)}
            StripsInImage: ${Math.floor((t.metaData.imageLength.data*(t.metaData.rowsPerStrip.data-1))/t.metaData.rowsPerStrip.data)};
            `)

const stripsImage = () => {
    let l = t.metaData.imageLength.data;
    let r = t.metaData.rowsPerStrip.data;
    let stripsInImg = Math.floor((l * (r-1))/r);
    console.log(stripsInImg)

}

stripsImage()





