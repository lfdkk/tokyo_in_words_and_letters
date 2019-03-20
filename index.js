const	wav= new require('wav'),
			reader = new wav.Reader();

const	tables= [
['い','・－'],
['ろ','・－・－'],
['は','－・・・'],
['に','－・－・'],
['ほ','－・・'],
['へ','・'],
['と','・・－・・'],
['ち','・・－・'],
['り','－－・'],
['ぬ','・・・・'],
['る','－・－－・'],
['を','・－－－'],
['わ','－・－'],
['か','・－・・'],
['よ','－－'],
['た','－・'],
['れ','－－－'],
['そ','－－－・'],
['つ','・－－・'],
['ね','－－・－'],
['な','・－・'],
['ら','・・・'],
['む','－'],
['う','・・－'],
['ゐ','・－・・－'],
['の','・・－－'],
['お','・－・・・'],
['く','・・・－'],
['や','・－－'],
['ま','－・・－'],
['け','－・－－'],
['ふ','－－・・'],
['こ','－－－－'],
['え','－・－－－'],
['て','・－・－－'],
['あ','－－・－－'],
['さ','－・－・－'],
['き','－・－・・'],
['ゆ','－・・－－'],
['め','－・・・－'],
['み','・・－・－'],
['し','－－・－・'],
['ゑ','・－－・・'],
['ひ','－－・・－'],
['も','－・・－・'],
['せ','・－－－・'],
['す','－－－・－'],
['ん','・－・－・'],
['゛','・・'],
['゜','・・－－・'],
['ー','・－－・－'],
['、','・－・－・－'],
['」','・－・－・・'],
['（','－・－－・－'],
['）','・－・・－・'],
['1','・－－－－'],
['2','・・－－－'],
['3','・・・－－'],
['4','・・・・－'],
['5','・・・・・'],
['6','－・・・・'],
['7','－－・・・'],
['8','－－－・・'],
['9','－－－－・'],
['0','－－－－－'],
['。','・－・－・－'],
['、','－－・・－－'],
['？','・・－－・・'],
['！','－・－・－－'],
['-','－・・・・－']
].sort((a, b)=>{
	return b[1].length>a[1].length ? 1 : -1;
});

const	config= {
			sampleSize: 0,
			sampleRate: 0,
			frameSize: 10,
			length: 0
		},
		vols= [];

let		buffer= Buffer.alloc(0);

const	pushVol= (buf, offset, len)=>{

	let sum= 0;
	for(let i=0; i<len; i+=config.sampleSize){
		sum+= Math.pow(buf.readInt16LE(offset+i), 2);
	}
	vols.push(Math.sqrt(sum/len));
};

reader.on('format', (format)=>{

	config.sampleSize= format.blockAlign;
	config.sampleRate= format.sampleRate;
	config.length= 0;

	console.log('');
	console.log(format);
});

reader.on('data', (chunk)=>{

	buffer= Buffer.concat([buffer, chunk]);

	config.length+= chunk.length;
});

reader.on('end', ()=>{

	const	numFrames= Math.floor((buffer.length/config.sampleSize) / config.frameSize);
	for(let i=0; i<numFrames; i++){
		pushVol(buffer, i*config.frameSize, config.frameSize);
	}

	const avgVol= vols.reduce((prev, curr)=>{
		return prev+curr;
	})/vols.length;

	let	minDuration= Infinity,
		mode= vols[0]>avgVol,
		cnt= 0;

	vols.forEach((vol, i)=>{
		if(mode){
			if(vol<avgVol){
				if(cnt<minDuration){
					minDuration= cnt;
				}
				mode= false;
				cnt= 0;
			} else {
				cnt++;
			}
		} else {
			if(avgVol<vol){
				if(cnt<minDuration){
					minDuration= cnt;
				}
				mode= true;
				cnt= 0;
			} else {
				cnt++;
			}
		}
	});

	// minDuration--;
	// mode= vols[0]>avgVol,
	cnt= 0;

	let morseStr= '';

	vols.forEach((vol, i)=>{
		cnt++;
		if(minDuration<cnt){
			morseStr+= vols[i-1]<avgVol ? '0' : '1';
			cnt= 0;
		}
	});

	const morse= morseStr
		.replace(/0000000/g, '<br>')
		.replace(/000/g, '　')
		.replace(/111/g, '－')
		.replace(/1/g, '・')
		.replace(/0/g, '');

	const morseArr= morse
		.split('　')
		.map((c)=>{
			let matched= false;
			tables.forEach((table)=>{
				if(matched){
					return;
				}
				const re= new RegExp(table[1], 'g');
				if(c.match(re)!=null){
					matched= true;
					c= c.replace(new RegExp(table[1], 'g'), table[0]);
				}
			});
			return c;
		});

	// console.log('-');
	console.log('');
	console.log(morseStr);
	console.log('');
	console.log(morse);
	console.log('');
	console.log(morseArr.join(''));
	// console.log(buffer.length);
	// console.log(config.length/config.sampleRate);
	// console.log(config.length);
	// console.log(vols.length);
	// console.log(avgVol);
	// console.log(numFrames);
	// console.log(minDuration);
	// console.log(vols.length*config.frameSize*config.sampleSize);
	// console.log('-');
	console.log('');
});

process.stdin.pipe(reader);
