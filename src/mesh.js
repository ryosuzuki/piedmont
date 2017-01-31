import THREE from 'three'
import FileSaver from 'file-saver'

import Geometry from './geometry'
import STLExporter from './three/stl-exporter'
import ThreeCSG from './three/three-csg'
import SvgToShape from './three/svg-to-shape'

import HollowGeometry from './hollow-geometry'

class Mesh extends THREE.Mesh {
  constructor (app) {
    super()
    this.app = app

    this.worker = new Worker('./worker.js');
    this.imageFile = '/public/assets/checkerboard.jpg' //bunny_1k.png'
    this.defaultMaterial = new THREE.MeshLambertMaterial({
      color: '#eee',
      vertexColors: THREE.FaceColors,
    });
    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: '#ff0',
      vertexColors: THREE.FaceColors,
      wireframe: true
    })
    this.material = this.defaultMaterial
    this.initialize()
  }

  initialize () {
    this.loadImage()
    this.geometry = new Geometry()
    this.geometry.file = this.app.file
    this.geometry.get()
    this.geometry.load()
    this.updateMorphTargets()
    this.position.setY(-this.geometry.boundingBox.min.y)
    this.original = this.geometry.clone()
    this.originalMesh = new THREE.Mesh(this.original, this.material)
    this.originalMesh.position.setY(-this.geometry.boundingBox.min.y)
    this.dynamic = true;
    this.castShadow = true;
    this.app.scene.add(this)
    this.getSelectIndex()
    if (_.includes(['cone', 'cylinder', 'chair', 'gecko'], this.app.model) === false) {
      this.rotateX(-Math.PI/2)
    }
    // this.rotateX(Math.PI/2)
  }

  computeNewMesh () {
    if (this.app.model === 'grip') {
      this.textureType = 'BUMP'
      this.computeBumpMesh()
      return false
    }
    if (this.app.model === 'house') {
      this.textureType = 'BUMP'
      this.computeBumpMesh()
      return false
    }
    if (this.app.model === 'turtle') {
      this.textureType = 'BUMP'
      this.computeBumpMesh()
      return false
    }
    if (this.app.model === 'gecko') {
      this.textureType = 'BUMP'
      this.computeBumpMesh()
      return false
    }
    if (this.app.model === 'chair') {
      this.textureType = 'HOLLOW'
      this.computeHollowMesh()
      return false
    }
    if (this.app.model === 'giraffe') {
      this.textureType = 'BUMP'
      this.computeBumpMesh()
      // this.textureType = 'HOLLOW'
      // this.computeHollowMesh()
      return false
    }

    // this.textureType = 'HOLLOW'
    // this.computeHollowMesh()
    // return

    this.textureType = 'BUMP'
    this.computeBumpMesh()
    return false

    this.textureType = 'HOLLOW'
    this.computeHollowCsgMesh()
  }

  computeBumpMesh () {
    this.app.pattern.computeSvgMeshPositions()
    const json = {
      model: this.app.model,
      type: this.textureType,
      action: 'bump',
      text: this.geometry.text,
      selectIndex: this.selectIndex,
      svgMeshPositions: this.app.pattern.svgMeshPositions,
    }
    const data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
      const data = event.data
      console.log(data);
      var geometry = data.ng
      this.showNewMesh(geometry)
    }.bind(this)
  }

  computeHollowMesh () {
    this.app.pattern.computeSvgMeshPositions()
    const json = {
      model: this.app.model,
      type: this.textureType,
      action: 'hollow',
      text: this.geometry.text,
      selectIndex: this.selectIndex,
      svgMeshPositions: this.app.pattern.svgMeshPositions,
    }
    const data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
      const data = event.data
      console.log(data);
      var geometry = data.ng
      this.showNewMesh(geometry)
    }.bind(this)
  }

  computeHollowCsgMesh () {
    this.items = []
    for (let i=0; i<this.app.pattern.items.length; i++) {
      let item = this.app.pattern.items[i]
      item.uv = this.app.convertCanvasToUv(item.bounds.center)
      let center = this.app.convertUvTo3d(item.uv)
      if (!center) continue
      let hash = {}
      hash.center = center.vertex
      hash.normal = center.normal

      if (this.app.model === 'house') {
        let face = this.geometry.faces[2506]
        hash.normal = face.normal
      }
      this.items.push(hash)
    }
    const json = {
      model: this.app.model,
      type: this.textureType,
      action: 'csg-hollow',
      text: this.geometry.text,
      items: this.items,
      position: this.position,
      pathData: this.app.paint.path.pathData
    }

    if (false) {
      this.unit = SvgToShape.transform(json.pathData)
      for (let i=0; i<this.items.length; i++) {
        let item = this.items[i]
        let x = item.center.x + this.position.x
        let y = item.center.y + this.position.y
        let z = item.center.z + this.position.z
        let center = new THREE.Vector3(x, y, z)
        let normal = new THREE.Vector3(item.normal.x, item.normal.y, item.normal.z)
        let vec = new THREE.Vector3()
        let scalar = 10 // (this.type === 'HOLLOW') ? 10 : 1
        let start = vec.clone().addVectors(
          center,
          normal.clone().multiplyScalar(-scalar)
        )
        let end = vec.clone().addVectors(
          center,
          normal.clone().multiplyScalar(scalar)
        )
        let spline = new THREE.CatmullRomCurve3([start, end]);
        let extrudeSettings = { amount: 1, bevelEnabled: false, extrudePath: spline };
        let geometry = new THREE.ExtrudeGeometry(this.unit, extrudeSettings);
        geometry.normalize()
        let scale = 0.05 // this.size
        geometry.scale(scale, scale, scale)
        item.mesh = new THREE.Mesh(geometry, this.material)
        item.mesh.position.set(x, y+0.428, z-0.428) // 0, 0.96, 0
        item.mesh.rotateX(-Math.PI/2)
        this.app.scene.add(item.mesh)
        this.items[i] = item
      }
      return false
    }

    if (app.debugging) {
      let hollowGeometry = new HollowGeometry()
      hollowGeometry.model = json.model
      hollowGeometry.text = json.text
      hollowGeometry.items = json.items
      hollowGeometry.type = json.type
      hollowGeometry.pathData = json.pathData
      hollowGeometry.position = json.position
      hollowGeometry.load()
      hollowGeometry.generate()
      this.nm = hollowGeometry.itemMeshCSG.toMesh()
      this.app.scene.add(this.nm)
      this.cm = hollowGeometry.meshCSG.toMesh()
      this.app.scene.add(this.cm)
      return false
    }

    const data = JSON.stringify(json)
    this.worker.postMessage(data);
    this.worker.onmessage = function(event) {
      const data = event.data
      console.log(data);
      var geometry = data.ng
      this.showNewMesh(geometry)
    }.bind(this)
  }

  getSelectIndex () {
    switch (this.app.model) {
      case 'house':
        this.selectIndex = [1847, 1849, 1850, 2502, 2503, 2504, 2505, 2506, 2507, 2508, 2530, 2531] //, 1804, 1805, 1844, 1845, 1846, 1848, 1862, 1863, 1864, 1865, 1869, 1870, 1871, 2499, 2500, 2501, 2525, 2526]
        break
      case 'grip':
        this.selectIndex = [249, 244, 331, 265, 336, 264, 250, 263, 252, 262, 344, 261, 346, 260, 230, 297, 233, 296, 234, 295, 255, 292, 349, 259, 350, 258, 256, 240, 248, 239, 352, 282, 360, 277, 208, 373, 210, 371, 251, 257, 253, 276, 254, 275, 318, 272, 319, 368, 320, 317, 321, 243, 323, 245, 322, 311, 324, 308, 246, 242, 247, 266, 325, 241]
        break
      case 'turtle':
        this.selectIndex = [193,374,147,440,327,549,406,477,348,179,102,311,20,415,449,351,168,493,606,578,502,27,26,572,255,124,548,323,443,565,534,293,275,284,268,625,476,501,29,641,531,589,169,69,24,512,248,320,537,220,155,441,624,289,243,447,437,470,21,18,496,577,276,221,312,511,138,491,131,170,582,581,481,479,409,446,11,492,400,19,335,430,162,17,48,587,305,228,23,617,249,609,556,120,464,109,153,486,92,404,253,635,590,480,460,329,532,427,500,490,56,76,195,174,215,183,630,2,357,632,301,405,59,308,196,438,272,99,47,78,119,389,245,144,533,143,515,247,510,417,43,189,101,166,402,513,262,115,34,96,295,473,560,616,283,282,378,509,172,593,123,122,422,384,212,28,340,54,53,130,376,226,419,211,631,628,94,184,424,401,310,157,79,223,62,465,456,288,205,579,366,292,580,598,242,281,130,313,615,53,147,440,3
        ]
        break
      case 'gecko':
        this.selectIndex = [...Array(this.geometry.faces.length).keys()]
        this.selectIndex = _.difference(this.selectIndex, [
          439,1396,26,328,66,1,85,45,76,31,71,4,16,865,769,1266,767,315,70,83,55,271,91,153,227,51,81,25,1402,661,873,409,410,215,46,13,198,196,22,555,963,1387,1274,489,822,197,12,195,1168,1169,446,607,1040,1278,191,189,188,48,214,54,80,30,68,40,23,58,39,63,137,50,43,33,204,17,257,47,14,15,79,544,545,286,42,2,6,60,49,1139,972,57,0,37,44,5,187,325,984,510,511,823,327,269,316,326,317,319,78,11,35,9,3,52,59,329,203,331,350,333,332,337,340,342,345,338,343,335,334,347,339,915,129,96,130,101,93,134,132,133,1159,956,114,115,125,954,441,440,126,124,120,123,1322,119,106,127,110,1398,1201,105,104,100,122,107,653,832,103,109,95,99,94,1312,585,674,1147,1246,719,718,135,557,1375,1198,540,1422,582,1376,1304,102,1285,336,918,841,561,1349,404,840,349,38,1325,955,53,1045,1439,1042,923,857,84,74,62,65,56,254,32,311,18,61,72,256,258,352,260,28,265,263,280,268,308,307,304,299,300,310,1360,1361,548,306,1241,298,292,294,295,1359,659,658,293,291,289,282,623,1103,1104,422,970,1438,301,288,1093,281,851,284,278,275,272,296,277,276,261,262,274,526,942,944,312,7,259,64,88,202,1140,973,433,434,8,86,19,89,36,90,330,87,314,541,267,183,77,844,1433,1079,617,1051,660,1057,252,34,24,313,67,20,82,147,253,251,206,1248,1395,209,211,220,216,248,218,245,247,229,228,250,222,217,855,270,223,210,224,249,238,240,246,239,707,234,233,236,1220,221,207,138,139,73,255,323,883,1287,1288,140,911,348,118,948,97,136,92,780,1423,1400,600,414,1280,621,1403,75,10,69,351,324,320,322,21,839,429,428,499,305,975,1181,1180,1218,571,572,264,266,506,503,283,285,1427,1226,492,834,29,534,225,141,145,1328,1327,162,172,192,146,152,989,1053,173,166,27,148,1187,154,1038,168,159,174,763,160,179,182,1205,1056,960,958,201,186,142,494,495,811
          ])
        break
      case 'chair':
        this.selectIndex = [3136,3131,9237,8794,9607,9608,9606,9257,9195,9196,8823,8824,9298,9297,8822,8800,9598,9512,8018,11603,11985,12363,12267,11952,8023,9506,9501,8816,9597,9565,11367,12004,10909,10906,27502,12857,8012,9515,9562,9599,9573,9480,11569,11849,12051,11506,7988,9529,9236,9260,9250,9301,9262,9319,9210,9620,9537,9622,8788,9207,9240,3090,3081,3083,9318,9617,9540,9541,9449,10639,10637,9226,9186,9205,3140,3068,3067,3057,3065,2996,2992,3051,9222,9224,9232,3043,3042,2909,4115,2975,2988,3143,3050,3049,3048,2993,3037,3124,2573,3497,3496,3457,2572,2597,3026,3114,3113,9283,9286,9287,8819,9266,9312,9299,7735,3111,3115,9265,9267,9293,9594,9556,9557,9507,9508,9268,2569,3315,1248,1249,2570,9295,9561,11413,11656,14034,12366,11955,11645,9518,9566,7740,9247,3078,3077,3076,9303,9197,8796,9602,9516,9517,9567,9569,9519,9522,8003,7774,8000,8005,12147,12149,12222,11410,7772,8016,7771,8022,8021,8020,7770,8028,8026,8010,8013,8004,8001,7775,9579,7997,7998,7995,7996,7991,7992,7987,7989,7984,7983,7982,7994,8002,7993,11376,11358,7976,7975,7973,9542,9543,9447,9448,9536,9533,9618,9616,9615,9614,9527,9575,9574,9523,9525,9477,9481,9482,7977,7968,7969,7970,9473,10641,10638,9619,8801,9317,8795,9189,9190,7741,9535,9474,7964,7965,7962,9402,10636,9625,8793,9208,9321,9239,9242,9254,9184,9624,7961,7950,7948,7952,7953,7949,9471,10509,7734,9218,9323,3070,3069,3055,3056,3139,9204,9228,8804,8790,8789,9324,10633,9446,9427,9425,10514,9326,8803,9213,2998,3137,3064,1177,3060,3134,2997,9231,9334,9160,8837,9107,10626,9124,8829,9108,9336,3141,2994,3511,3510,3513,2563,3033,3046,4113,9142,9141,9135,4114,2991,3471,3515,2562,2587,2588,3006,3005,2983,2982,2582,2574,3524,3379,3430,3428,3286,3285,3284,3283,3417,3374,3272,2580,3003,2970,2666,2892,9133,9157,9106,9126,8826,9441,9422,10516,9396,9397,9398,10518,9418,8773,8784,8832,8833,9120,8782,9436,10521,10329,9459,9458,9457,9455,9392,10662,10335,10791,10795,10797,10800,10802,9001,10804,9000,8777,8763,9413,10334,9390,9352,9351,10663,9435,8768,8785,9149,2896,2661,2965,3536,3369,3412,3413,3198,3186,3187,3280,3279,2976,2895,2850,9013,9102,10622,9121,8831,8830,8772,8771,9438,9437,8766,8776,8998,2620,3259,3176,3206,3205,3156,1340,3162,3160,3159,1336,1330,1332,3424,1323,1318,1312,1313,1308,1309,1319,1327,1325,1324,1331,4885,4911,5082,5483,7377,5432,5433,5604,5434,5482,6669,3478,1294,1295,1303,7385,25910,5189,7673,7232,4863,3422,3434,3436,3438,3476,3337,3336,3289,3291,3294,3296,1322,3425,3295,3432,3435,3437,3439,3475,3522,3274,3271,3269,3268,3267,3266,3367,3368,3366,3364,3261,3542,2921,2920,2903,4126,2978,2594,3431,3433,3427,1166,3426,3517,3519,3045,2576,2592,2583,3004,2590,3523,3520,2577,4117,2893,2928,2667,2987,2578,3473,3472,3470,3333,3144,9140,9139,9200,3035,2995,2564,2565,3059,3507,3505,3503,3501,3500,3499,3498,2567,3319,1257,5052,5461,7545,7550,4962,1267,1272,1277,1279,1284,1288,1290,1297,1296,3479,6654,5578,4427,3109,3110,2596,3458,3456,3454,3451,3490,3489,3107,9272,9288,8818,9269,9307,9560,9600,9603,9609,9259,3127,3491,3104,9289,9589,9553,9503,9555,9559,9578,9483,9534,9220,3039,3038,3138,9191,9570,9479,9486,9487,9538,7736,3030,9261,9248,9520,9576,9221,3504,3117,3118,9313,9258,9185,9227,3034,9263,9568,8006,8821,8820,9595,9596,9564,8009,8035,11419,11489,12152,12158,12157,12155,14037,11630,12207,12360,12306,7773,12358,12067,10904,12252,9563,9571,11613,12944,12017,11920,11457,9577,7980,9294,9612,9530,7974,9484,9198,9311,12022,9531,9215,3082,3089,9539,9241,9320,7956,7958,9206,3054,3014,3074,3073,9428,10513,10650,10651,10652,9230,9426,9388,7927,7922,9389,10658,9183,9332,9021,8779,9412,9411,9410,10630,3135,8764,9008,8774,3474,3335,2665,2640,2856,2984,2561,1178,2589,2971,4119,2591,3277,3329,3467,3508,3509,3066,3512,3287,3477,1274,4931,1280,1299,1293,1301,1210,1306,3421,3378,3377,3528,2558,2584,2586,3276,3273,3288,3293,3429,3290,5560,7707,7199,1300,3009,3047,2990,2908,7738,9181,3010,3008,9159,9404,7742,10634,9325,10510,10640,9187,7743,7957,11519,11582,9488,9476,9475,11381,12936,12011,11660,11572,11614,11575,11619,11578,11580,11559,11466,11397,11347,11474,7999,9524,9485,9532,9613,9401,10655,9610,9393,10657,10659,9403,9621,9238,9192,7739,9309,9590,10823,14026,11427,8030,9505,9552,9554,9558,9551,9498,11685,11438,11651,11649,9510,8049,8815,9605,9310,9249,3309,5658,4448,1235,3129,9305,9282,3095,3101,8806,9271,9280,3097,3094,9279,9275,9592,3487,3447,3023,1167,3016,7536,4441,3312,3021,3025,3450,3310,1246,2595,3313,4437,3075,9251,3015,9256,9255,9243,9611,8797,3105,3445,3307,3121,3492,3495,3052,9216,3011,1247,3013,3087,3088,3012,2566,3086,1253,3085,3058,3460,3459,3502,3084,1175,3322,3462,3506,3465,3327,3325,3466,3326,1268,3468,5584,5813,3328,6652,4414,5466,1276,3330,7360,5588,5589,1286,3332,3334,3521,5090,5597,5596,1302,6781,6782,3190,5480,7372,5088,1285,2989,3323,3036,7359,5856,5755,7718,4930,3516,9322,9217,9511,8038,12353,14022,8015,8014,11480,11600,12361,11983,8029,9514,11663,11850,11550,9604,9478,9572,2598,8791,8792,3125,3061,9193,9209,11560,3494,5001,10635,9623,11516,9233,9235,10643,10645,10508,9219,10642,9314,9453,7930,9354,9212,9223,9335,9333,3031,9244,9245,9528,9526,9521,8036,12844,12849,8017,12078,7767,11451,9580,9591,9296,3123,3119,3133,11607,3469,3518,9234,3275,3000,9012,2575,3062,9330,3331,3455,1255,1271,2557,1260,2894,10621,8827,9439,10517,9470,9337,7978,11515,3029,10631,8836,9136,3146,2974,9182,4908,5746,3149,3147,9339,9338,9180,9229,8805,8802,9329,9327,9112,9111,9023,9022,8778,10632,9400,9429,10511,9444,9445,9129,9128,9127,10628,10629,9110,9109,9394,10646,10647,9469,9468,9467,9364,9464,9365,9366,9367,9368,9369,9371,7945,7946,9358,9359,9362,9454,10661,10660,10333,10332,10331,10330,10523,10524,10525,10527,10664,10337,10336,10528,9432,9433,7744,8769,8770,8786,8787,8834,8835,9118,10620,10619,9100,9099,9101,10623,10624,9123,10625,9017,9016,9105,9019,9156,9132,9131,2925,2926,2924,2923,9134,9144,9145,9010,9146,9147,9340,4116,4118,2973,2986,2985,3007,2585,2911,2593,3529,3530,3531,2559,2560,3527,3526,3525,3375,3376,3418,3419,3420,3201,3282,3416,3373,3372,3371,3532,3533,2579,3002,2980,2968,2969,2556,4121,4120,2664,4122,2554,2553,2964,3537,3538,2963,2551,4127,2658,2918,2901,2900,2933,2636,2637,2858,2934,2917,3541,3540,3255,3361,3362,3404,3405,3177,3179,3193,3182,3183,3196,3195,3411,3184,3185,1333,1329,3188,1326,1316,1317,1320,1311,1321,3292,1305,3338,3514,1179,9214,9188,7985,8799,8798,9194,9246,9601,9300,9304,3122,3130,3128,3126,3027,3024,3108,9270,9306,9509,9513,3071,3072,1176,3461,3463,3464,3324,3321,3320,1259,5013,5014,5012,7552,1264,1263,1270,1269,1266,1273,1278,1283,1282,1287,1289,1291,1262,1256,1252,1254,1244,3452,3314,3316,3317,3318,3449,3488,3486,3485,3484,3100,3098,3096,2599,3092,9281,9278,9276,9292,9586,9550,9331,9328,9424,9423,10512,9395,10648,9466,9472,7966,7963,7959,11306,11307,14065,13458,11309,11301,7944,7939,7940,7941,7938,9360,7777,9450,9452,9361,9373,9391,10526,9414,9415,9416,9417,10520,10519,9399,9421,10627,9020,9161,9104,8838,9137,9138,9018,9125,8828,8781,8780,8765,8767,9150,2851,9152,9153,9154,9155,9014,9015,9103,1168,2927,2852,2853,2854,2855,1170,2870,9097,9096,10618,9117,10617,10616,2873,2872,9115,9116,8997,8999,9119,9122,9004,9005,9006,9007,9009,9431,9430,1169,2907,3148,9011,9158,2910,2912,2913,2663,2915,2916,2899,2932,2931,2638,2639,2929,2930,2897,2857,2654,2874,2876,2877,2878,2879,2650,2861,2862,2633,2632,2937,2936,2655,2656,2657,4128,4129,3257,3256,3359,3360,3263,3264,3265,3539,3535,3534,2999,2977,2966,2967,2555,4123,2660,4124,4125,2552,2981,2581,3370,3270,3414,3281,3189,1314,1315,1310,4916,1307,3423,1334,3158,1339,1337,1338,1344,1343,1342,3163,3164,3165,3192,3180,3191,3181,3173,3174,3178,3407,3409,3410,3408,3197,3199,3200,3415,3001,2979,2898,9094,9095,2871,10644,9462,9461,9460,9372,10328,9419,9420,8775,10522,10649,9465,9463,1298,6794,2972,2785,2612,2804,2883,2648,2634,2914,9199,9443,9442,9440,10515,10326,10653,10654,10327,10656,9355,9356,9357,9451,9353,8825,9434,8783,2662,2659,2919,2550,3365,11317,13465,13464,11318,11319,14069,14070,14071,14072,11404,11337,13461,3363,3406,3262,5481,3120,3022,3106,2571,3493,3453,1239,3311,1242,1243,9274,9593,9291,8060,8809,8811,8814,9584,9547,9491,9549,9548,9585,9290,8817,9588,3020,3019,1174,3017,2568,3448,3446,1240,4977,1238,9308,9504,8037,7768,11435,8039,9502,9500,9496,9495,9583,8812,8810,8059,3091,2600,2602,3099,8807,9587,3102,3018,1241,1251,5148,5007,6647,6648,7543,5006,5150,1250,7769,8008]

        break;
      default:
        const epsilon = 0.001
        this.selectIndex = []
        let vec = new THREE.Vector3(0, 1, 0)
        for (let i=0; i<this.geometry.faces.length; i++) {
          let face = this.geometry.faces[i]
          if (Math.abs(face.normal.dot(vec)) === 1) continue
          this.selectIndex.push(i)
        }
        break
    }
    this.selectFaceVertexUvs()
  }

  selectFaceVertexUvs () {
    for (let i=0; i<this.geometry.faces.length; i++) {
      if (_.includes(this.selectIndex, i)) continue
      this.geometry.faceVertexUvs[0][i] = [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0)
      ]
    }
  }

  getSimilarFace () {
    if (this.app.model === 'house') {
      this.getSimilarHouseFace()
    } else if (this.app.model === 'grip') {
      this.getSimilarGripFace()
    }
    this.showSimilarFace()
  }

  getSimilarGripFace (epsilon) {
    if (!epsilon) epsilon = 0.1
    if (!this.geometry.uniq) this.geometry.computeUniq()
    var face = this.app.current.face
    var a = this.geometry.uniq[face.a]
    var b = this.geometry.uniq[face.b]
    var c = this.geometry.uniq[face.c]

    this.faces = [this.app.current.faceIndex]
    var queue = [this.app.current.faceIndex]
    var finished = []
    while (queue.length > 0) {
      var faceIndex = queue.shift()
      var currentFace = this.geometry.faces[faceIndex]

      var a = this.geometry.uniq[this.geometry.map[currentFace.a]]
      var b = this.geometry.uniq[this.geometry.map[currentFace.b]]
      var c = this.geometry.uniq[this.geometry.map[currentFace.c]]
      var faceAB = _.pull(_.intersection(a.faces, b.faces), faceIndex)
      var faceBC = _.pull(_.intersection(b.faces, c.faces), faceIndex)
      var faceCA = _.pull(_.intersection(c.faces, a.faces), faceIndex)
      var nextFaces = _.union(faceAB, faceBC, faceCA)

      var cos = nextFaces.map( function (index) {
        var nextFace = this.geometry.faces[index]
        return currentFace.normal.dot(nextFace.normal)
      }.bind(this))
      for (var i=0; i<3; i++) {
        var cos_a = cos[i]
        var cos_b = cos[(i+1)%3]
        var cos_c = cos[(i+2)%3]
        var bool = Math.abs(cos_a-1) < epsilon
                || Math.abs(cos_a-cos_b) < epsilon
                || Math.abs(cos_a-cos_c) < epsilon
        if (bool) {
          if (!finished.includes(nextFaces[i])) {
            queue = _.union(queue, [nextFaces[i]])
          }
          this.faces.push(nextFaces[i])
        }
      }
      this.faces = _.uniq(this.faces)
      finished.push(faceIndex)
    }
  }

  showSimilarFace() {
    this.sg = new THREE.Geometry()
    for (let i=0; i<this.faces.length; i++) {
      let index = this.faces[i]
      let face = this.geometry.faces[index]
      var num = this.sg.vertices.length
      this.sg.vertices.push(this.geometry.vertices[face.a])
      this.sg.vertices.push(this.geometry.vertices[face.b])
      this.sg.vertices.push(this.geometry.vertices[face.c])
      this.sg.faces.push(new THREE.Face3(num, num+1, num+2))
    }
    this.sm = new THREE.Mesh(this.sg, new THREE.MeshLambertMaterial({
      color: '#f00',
      vertexColors: THREE.FaceColors,
    }))
    this.sm.position.setY(this.position.y)
    this.app.scene.add(this.sm)
    this.app.scene.remove(this)
  }

  getSimilarHouseFace () {
    const epsilon = 0.01
    let currentFace = this.app.current.face
    if (!this.faces) this.faces = []
    var ng = new THREE.Geometry()
    for (let i=0; i<this.geometry.faces.length; i++) {
      let face = this.geometry.faces[i]
      let diff = currentFace.normal.dot(face.normal)
      if (Math.abs(1 - diff) < epsilon) {
        this.faces.push(i)
        console.log(diff, i)
      }
    }
  }

  loadImage () {
    var loader = new THREE.TextureLoader();
    loader.load(this.imageFile, function (image) {
      this.uvImage = image
      this.uvImage.minFilter = THREE.LinearFilter;
      // this.uvImage.wrapS = THREE.RepeatWrapping;
      // this.uvImage.wrapT = THREE.RepeatWrapping;
      this.uvImage.needsUpdate = true
      this.uvMaterial = new THREE.MeshLambertMaterial({
        color: '#fff',
        map: this.uvImage,
        transparent: true,
      });
    }.bind(this));

  }

  replace (type) {
    switch (type) {
      case 'uv':
        this.material = this.uvMaterial
        break;
      case 'canvas':
        let canvas = document.getElementById('drawing')
        this.canvasImage = new THREE.Texture(canvas)
        this.canvasImage.flipY = false
        this.canvasImage.minFilter = THREE.LinearFilter
        this.canvasImage.needsUpdate = true
        // this.canvasImage.wrapS = THREE.RepeatWrapping;
        // this.canvasImage.wrapT = THREE.RepeatWrapping;
        this.canvasImage.magFilter = THREE.NearestFilter
        // this.canvasImage.repeat.set(2, 2);
        this.canvasMaterial = new THREE.MeshLambertMaterial({
          map: this.canvasImage,
          transparent: true
        });

        this.material = this.canvasMaterial
        break;
      case 'wire':
        this.material = this.wireMaterial
        break;
      default:
        this.material = this.defaultMaterial
        break;
    }
    this.app.scene.remove(this)
    this.updateMorphTargets()
    this.app.scene.add(this);
  }

  showNewMesh (geometry) {
    this.ng = new Geometry()
    for (var i=0; i<geometry.faces.length; i++) {
      try {
      var a = geometry.vertices[geometry.faces[i].a]
      var b = geometry.vertices[geometry.faces[i].b]
      var c = geometry.vertices[geometry.faces[i].c]

      var va = new THREE.Vector3(a.x, a.y, a.z)
      var vb = new THREE.Vector3(b.x, b.y, b.z)
      var vc = new THREE.Vector3(c.x, c.y, c.z)

      var num = this.ng.vertices.length
      this.ng.vertices.push(va)
      this.ng.vertices.push(vb)
      this.ng.vertices.push(vc)
      this.ng.faces.push(new THREE.Face3(num, num+1, num+2))
      } catch (err) {
        console.log(err)
      }
    }

    this.geometry = this.ng
    this.geometry.computeFaceNormals()
    this.replace()
    this.app.finish = true

    this.originalMesh = new THREE.Mesh(this.original, this.material)
    // this.app.scene.add(this.originalMesh)
  }

  showInnerMesh () {
    this.innerMesh = new THREE.Mesh(this.geometry, this.material)
    this.innerMesh.scale.set(0.9, 0.9, 0.9)
    let x = 0 + this.position.x
    let y = 0.05 + this.position.y
    let z = 0 + this.position.z
    this.innerMesh.position.set(x, y, z)
    this.app.scene.add(this.innerMesh)
    this.app.scene.remove(this)
  }

  export () {
    let exporter = new STLExporter();
    let stlString = exporter.parse(this)
    let blob = new Blob([stlString], {type: 'text/plain'});
    FileSaver.saveAs(blob, `${Date.now()}.stl`);
  }


  /*
  computeNewMesh () {

    switch (this.app.model) {
      case 'house':
        this.size = 0.1
        break
      case 'speaker':
        this.size = 0.12
        break
      default:
        this.size = 0.1
        break
    }

    this.createEggMesh()

    if (this.app.model === 'house') {
      this.createEggMesh()
      // this.createHouseMesh()
    } else if (this.app.model === 'speaker') {
      this.createEggMesh()
    } else {
      this.computeBumpMesh()
    }
    if (this.textureType === 'BUMP') {
      this.computeBumpMesh()
    } else {
      this.computeHollowMesh()
    }
  }

  createHouseMesh () {
    let items = []
    for (let i=0; i<this.app.pattern.items.length; i++) {
      let item = this.app.pattern.items[i]
      item.uv = this.app.convertCanvasToUv(item.bounds.center)
      let center = this.app.convertUvTo3d(item.uv)
      if (!center) continue
      let hash = {}
      hash.center = center.vertex
      hash.normal = center.normal
      items.push(hash)
    }

    let box = new THREE.BoxGeometry(0.1, 0.05, 0.05)
    for (let i=0; i<items.length; i++) {
      let item = items[i]
      let mesh = new THREE.Mesh(box, this.defaultMaterial)
      mesh.position.set(item.center.x, item.center.y, item.center.z)
      let angle = Math.atan(item.normal.y/item.normal.z)
      mesh.rotation.set(-angle, 0, 0)
      this.app.scene.add(mesh)
    }

  }


  */



  extrude () {

    var path = this.app.paint.path.pathData
    this.shape = SvgToShape.transform(path)
    // this.shapeGeometry = this.shape.makeGeometry()

    // this.shapeGeometry.computeBoundingBox()
    // let max = this.shapeGeometry.boundingBox.max
    // let min = this.shapeGeometry.boundingBox.min
    // let width = max.x - min.x
    // let height = max.y - min.y

    // let itemWidth = this.app.pattern.item.bounds.width
    // let itemHeight = this.app.pattern.item.bounds.height
    // let itemMin = new Paper.Point(this.app.pattern.item.bounds)
    // let itemMax = new Paper.Point(itemMin.x + itemWidth, itemMin.y + itemHeight)
    // let itemCenter = this.app.pattern.item.bounds.center

    let uvCenter = this.app.convertCanvasToUv(itemCenter)
    // let uvMin = this.app.convertCanvasToUv(itemMin)
    // let uvMax = this.app.convertCanvasToUv(itemMax)

    let centerInfo = this.app.convertUvTo3d(uvCenter)
    // let minInfo = this.app.convertUvTo3d(uvMin)
    // let maxInfo = this.app.convertUvTo3d(uvMax)
    let center = centerInfo.vertex
    let normal = centerInfo.normal

    this.centerInfo = centerInfo

    normal.xz = Math.sqrt(normal.x**2 + normal.z**2)
    var axisY = new THREE.Vector3(0, 1, 0)
    var rotateY = Math.atan(normal.z/normal.x)
    var axisXZ = new THREE.Vector3(-normal.z, 0, normal.x)
    var rotateXZ = Math.atan(normal.y/normal.xz)


    var scale = 1/220
    var thick = 0.1
    let vec = new THREE.Vector3()
    let start = vec.clone().addVectors(center, normal.clone().multiplyScalar(-thick))
    let end = vec.clone().addVectors(center, normal.clone().multiplyScalar(thick/scale))
    let points = [start, end]
    var spline = new THREE.CatmullRomCurve3(points);

    var extrudeSettings = { bevelEnabled: false, extrudePath: spline};
    var geometry = new THREE.ExtrudeGeometry(this.shape, extrudeSettings);
    this.shapeGeometry = new THREE.Mesh(geometry, this.defaultMaterial);
    this.shapeGeometry.scale.set(scale, scale, scale)
    this.shapeGeometry.position.set(start.x, start.y, start.z)
    this.shapeGeometry.rotateOnAxis(normal, 3*Math.PI/2)
    // this.shapeGeometry.rotateOnAxis(axisXZ, rotateXZ)
    // this.app.scene.add(this.shapeGeometry);
  };

  /*

  createBumpMesh () {
    console.log('Start createBumpMesh')
    for (let i=0; i<this.items.length; i++) {
      let item = this.items[i]
      let x = item.center.x + this.position.x
      let y = item.center.y + this.position.y
      let z = item.center.z + this.position.z
      let center = new THREE.Vector3(x, y, z)
      let normal = new THREE.Vector3(item.normal.x, item.normal.y, item.normal.z)
      let vec = new THREE.Vector3()
      let scalar = (this.textureType === 'HOLLOW') ? 10 : 1
      let start = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(-scalar)
      )
      let end = vec.clone().addVectors(
        center,
        normal.clone().multiplyScalar(scalar)
      )
      let spline = new THREE.CatmullRomCurve3([start, end]);
      let extrudeSettings = { amount: 1, bevelEnabled: false, extrudePath: spline };
      let geometry = new THREE.ExtrudeGeometry(this.unit, extrudeSettings);
      geometry.normalize()
      item.mesh = new THREE.Mesh(geometry, this.defaultMaterial)
      item.mesh.position.set(x, y, z)
      let scale = this.size
      item.mesh.scale.set(scale, scale, scale)
      this.items[i] = item
    }

    console.log('Start createMeshCSG')
    this.meshCSG = new ThreeCSG(this)
    this.itemMeshCSG = new ThreeCSG(this.items[0].mesh)
    for (let i=1; i<this.items.length; i++) {
      console.log('Start updating meshCSG')
      let itemMeshCSG = new ThreeCSG(this.items[i].mesh)
      this.itemMeshCSG = this.itemMeshCSG.union(itemMeshCSG)
    }
    if (this.textureType === 'BUMP') {
      console.log('BUMP: Union the all CSG meshes')
      this.meshCSG = this.meshCSG.union(this.itemMeshCSG)
    } else {
      console.log('HOLLOW: Subtract the all CSG meshes')
      this.innerMesh = new THREE.Mesh(this.geometry, this.material)
      this.innerMesh.scale.set(0.9, 0.9, 0.9)
      let x = 0 + this.position.x
      let y = 0.05 + this.position.y
      let z = 0 + this.position.z
      this.innerMesh.position.set(x, y, z)
      this.innerMeshCSG = new ThreeCSG(this.innerMesh)
      console.log('Inner mesh subtraction')
      if (this.app.model !== 'lamp') {
        this.meshCSG = this.meshCSG.subtract(this.innerMeshCSG)
      }
      console.log('Item mesh subtraction')
      this.meshCSG = this.meshCSG.subtract(this.itemMeshCSG)
    }
    this.geometry = this.meshCSG.toGeometry()
    this.geometry.computeFaceNormals()
    this.replace()
    this.app.finish = true
  }
  */

}

export default Mesh
