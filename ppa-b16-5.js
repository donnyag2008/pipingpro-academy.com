/* =============================================================================
 * ASME B16.5-2003 — Pipe Flange Dimensions (NPS 1/2 through NPS 24)
 * PipingPro Academy · shared dimensional dataset
 * -----------------------------------------------------------------------------
 * Per-class records keyed by NPS label. Linear dimensions are in MILLIMETRES
 * (this is the B16.5 Metric/Inch edition; metric tables govern). Bolt and bolt-
 * hole diameters are decimal INCHES, as the standard tabulates them.
 *
 *   O        flange outside diameter            (mm)
 *   tf       minimum flange thickness            (mm)   [raised-face flanges]
 *   X        hub diameter at base                (mm)
 *   A        hub diameter at welding-neck bore   (mm)   (= matching pipe OD)
 *   Y        length through hub, welding neck    (mm)
 *   BC       bolt-circle diameter (W)            (mm)
 *   n        number of bolts
 *   holeDia  bolt-hole diameter                  (in)
 *   boltDia  bolt diameter                       (in)
 *
 * PROVENANCE / VALIDATION
 *   O, tf, X, A, Y read from the metric dimension tables (8/11/14/16/18/20/22)
 *   and cross-validated against the inch Annex F tables (O_in x 25.4 == O_mm).
 *   BC, n, holeDia, boltDia read directly from the drilling templates
 *   (Tables 7/10/13/15/17/19/21) on the rasterised pages.
 *   Per the standard's own notes: Class 400 NPS 1/2-3.5 use Class 600
 *   dimensions; Class 900 NPS 1/2-2.5 use Class 1500 dimensions — resolved
 *   into explicit rows below.
 *
 * NOT INCLUDED (tabulated elsewhere in B16.5, deliberately omitted here):
 *   raised-face outside diameter and hub fillet radius.
 *
 * Coverage: 150/300/400/600 -> NPS 1/2-24 ; 900/1500 -> NPS 1/2-24 (no 3.5) ;
 *           2500 -> NPS 1/2-12.
 * ===========================================================================*/

const B16_5 = {
  "150":{
    "1/2":{O:90,tf:9.6,X:30,A:21.3,Y:46,BC:60.3,n:4,holeDia:0.625,boltDia:0.5},
    "3/4":{O:100,tf:11.2,X:38,A:26.7,Y:51,BC:69.9,n:4,holeDia:0.625,boltDia:0.5},
    "1":{O:110,tf:12.7,X:49,A:33.4,Y:54,BC:79.4,n:4,holeDia:0.625,boltDia:0.5},
    "1-1/4":{O:115,tf:14.3,X:59,A:42.2,Y:56,BC:88.9,n:4,holeDia:0.625,boltDia:0.5},
    "1-1/2":{O:125,tf:15.9,X:65,A:48.3,Y:60,BC:98.4,n:4,holeDia:0.625,boltDia:0.5},
    "2":{O:150,tf:17.5,X:78,A:60.3,Y:62,BC:120.7,n:4,holeDia:0.75,boltDia:0.625},
    "2-1/2":{O:180,tf:20.7,X:90,A:73.0,Y:68,BC:139.7,n:4,holeDia:0.75,boltDia:0.625},
    "3":{O:190,tf:22.3,X:108,A:88.9,Y:68,BC:152.4,n:4,holeDia:0.75,boltDia:0.625},
    "3-1/2":{O:215,tf:22.3,X:122,A:101.6,Y:70,BC:177.8,n:8,holeDia:0.75,boltDia:0.625},
    "4":{O:230,tf:22.3,X:135,A:114.3,Y:75,BC:190.5,n:8,holeDia:0.75,boltDia:0.625},
    "5":{O:255,tf:22.3,X:164,A:141.3,Y:87,BC:215.9,n:8,holeDia:0.875,boltDia:0.75},
    "6":{O:280,tf:23.9,X:192,A:168.3,Y:87,BC:241.3,n:8,holeDia:0.875,boltDia:0.75},
    "8":{O:345,tf:27.0,X:246,A:219.1,Y:100,BC:298.5,n:8,holeDia:0.875,boltDia:0.75},
    "10":{O:405,tf:28.6,X:305,A:273.0,Y:100,BC:362.0,n:12,holeDia:1,boltDia:0.875},
    "12":{O:485,tf:30.2,X:365,A:323.8,Y:113,BC:431.8,n:12,holeDia:1,boltDia:0.875},
    "14":{O:535,tf:33.4,X:400,A:355.6,Y:125,BC:476.3,n:12,holeDia:1.125,boltDia:1},
    "16":{O:595,tf:35.0,X:457,A:406.4,Y:125,BC:539.8,n:16,holeDia:1.125,boltDia:1},
    "18":{O:635,tf:38.1,X:505,A:457.0,Y:138,BC:577.9,n:16,holeDia:1.25,boltDia:1.125},
    "20":{O:700,tf:41.3,X:559,A:508.0,Y:143,BC:635.0,n:20,holeDia:1.25,boltDia:1.125},
    "24":{O:815,tf:46.1,X:663,A:610.0,Y:151,BC:749.3,n:20,holeDia:1.375,boltDia:1.25}
  },
  "300":{
    "1/2":{O:95,tf:12.7,X:38,A:21.3,Y:51,BC:66.7,n:4,holeDia:0.625,boltDia:0.5},
    "3/4":{O:115,tf:14.3,X:48,A:26.7,Y:56,BC:82.6,n:4,holeDia:0.75,boltDia:0.625},
    "1":{O:125,tf:15.9,X:54,A:33.4,Y:60,BC:88.9,n:4,holeDia:0.75,boltDia:0.625},
    "1-1/4":{O:135,tf:17.5,X:64,A:42.2,Y:64,BC:98.4,n:4,holeDia:0.75,boltDia:0.625},
    "1-1/2":{O:155,tf:19.1,X:70,A:48.3,Y:67,BC:114.3,n:4,holeDia:0.875,boltDia:0.75},
    "2":{O:165,tf:20.7,X:84,A:60.3,Y:68,BC:127.0,n:8,holeDia:0.75,boltDia:0.625},
    "2-1/2":{O:190,tf:23.9,X:100,A:73.0,Y:75,BC:149.2,n:8,holeDia:0.875,boltDia:0.75},
    "3":{O:210,tf:27.0,X:117,A:88.9,Y:78,BC:168.3,n:8,holeDia:0.875,boltDia:0.75},
    "3-1/2":{O:230,tf:28.6,X:133,A:101.6,Y:79,BC:184.2,n:8,holeDia:0.875,boltDia:0.75},
    "4":{O:255,tf:30.2,X:146,A:114.3,Y:84,BC:200.0,n:8,holeDia:0.875,boltDia:0.75},
    "5":{O:280,tf:33.4,X:178,A:141.3,Y:97,BC:235.0,n:8,holeDia:0.875,boltDia:0.75},
    "6":{O:320,tf:35.0,X:206,A:168.3,Y:97,BC:269.9,n:12,holeDia:0.875,boltDia:0.75},
    "8":{O:380,tf:39.7,X:260,A:219.1,Y:110,BC:330.2,n:12,holeDia:1,boltDia:0.875},
    "10":{O:445,tf:46.1,X:321,A:273.0,Y:116,BC:387.4,n:16,holeDia:1.125,boltDia:1},
    "12":{O:520,tf:49.3,X:375,A:323.8,Y:129,BC:450.8,n:16,holeDia:1.25,boltDia:1.125},
    "14":{O:585,tf:52.4,X:425,A:355.6,Y:141,BC:514.4,n:20,holeDia:1.25,boltDia:1.125},
    "16":{O:650,tf:55.6,X:483,A:406.4,Y:144,BC:571.5,n:20,holeDia:1.375,boltDia:1.25},
    "18":{O:710,tf:58.8,X:533,A:457.0,Y:157,BC:628.6,n:24,holeDia:1.375,boltDia:1.25},
    "20":{O:775,tf:62.0,X:587,A:508.0,Y:160,BC:685.8,n:24,holeDia:1.375,boltDia:1.25},
    "24":{O:915,tf:68.3,X:702,A:610.0,Y:167,BC:812.8,n:24,holeDia:1.625,boltDia:1.5}
  },
  "400":{
    "1/2":{O:95,tf:14.3,X:38,A:21.3,Y:52,BC:66.7,n:4,holeDia:0.625,boltDia:0.5},
    "3/4":{O:115,tf:15.9,X:48,A:26.7,Y:57,BC:82.6,n:4,holeDia:0.75,boltDia:0.625},
    "1":{O:125,tf:17.5,X:54,A:33.4,Y:62,BC:88.9,n:4,holeDia:0.75,boltDia:0.625},
    "1-1/4":{O:135,tf:20.7,X:64,A:42.2,Y:67,BC:98.4,n:4,holeDia:0.75,boltDia:0.625},
    "1-1/2":{O:155,tf:22.3,X:70,A:48.3,Y:70,BC:114.3,n:4,holeDia:0.875,boltDia:0.75},
    "2":{O:165,tf:25.4,X:84,A:60.3,Y:73,BC:127.0,n:8,holeDia:0.75,boltDia:0.625},
    "2-1/2":{O:190,tf:28.6,X:100,A:73.0,Y:79,BC:149.2,n:8,holeDia:0.875,boltDia:0.75},
    "3":{O:210,tf:31.8,X:117,A:88.9,Y:83,BC:168.3,n:8,holeDia:0.875,boltDia:0.75},
    "3-1/2":{O:230,tf:35.0,X:133,A:101.6,Y:86,BC:184.2,n:8,holeDia:1,boltDia:0.875},
    "4":{O:255,tf:35.0,X:146,A:114.3,Y:89,BC:200.0,n:8,holeDia:1,boltDia:0.875},
    "5":{O:280,tf:38.1,X:178,A:141.3,Y:102,BC:235.0,n:8,holeDia:1,boltDia:0.875},
    "6":{O:320,tf:41.3,X:206,A:168.3,Y:103,BC:269.9,n:12,holeDia:1,boltDia:0.875},
    "8":{O:380,tf:47.7,X:260,A:219.1,Y:117,BC:330.2,n:12,holeDia:1.125,boltDia:1},
    "10":{O:445,tf:54.0,X:321,A:273.0,Y:124,BC:387.4,n:16,holeDia:1.25,boltDia:1.125},
    "12":{O:520,tf:57.2,X:375,A:323.8,Y:137,BC:450.8,n:16,holeDia:1.375,boltDia:1.25},
    "14":{O:585,tf:60.4,X:425,A:355.6,Y:149,BC:514.4,n:20,holeDia:1.375,boltDia:1.25},
    "16":{O:650,tf:63.5,X:483,A:406.4,Y:152,BC:571.5,n:20,holeDia:1.5,boltDia:1.375},
    "18":{O:710,tf:66.7,X:533,A:457.0,Y:165,BC:628.6,n:24,holeDia:1.5,boltDia:1.375},
    "20":{O:775,tf:69.9,X:587,A:508.0,Y:168,BC:685.8,n:24,holeDia:1.625,boltDia:1.5},
    "24":{O:915,tf:76.2,X:702,A:610.0,Y:175,BC:812.8,n:24,holeDia:1.875,boltDia:1.75}
  },
  "600":{
    "1/2":{O:95,tf:14.3,X:38,A:21.3,Y:52,BC:66.7,n:4,holeDia:0.625,boltDia:0.5},
    "3/4":{O:115,tf:15.9,X:48,A:26.7,Y:57,BC:82.6,n:4,holeDia:0.75,boltDia:0.625},
    "1":{O:125,tf:17.5,X:54,A:33.4,Y:62,BC:88.9,n:4,holeDia:0.75,boltDia:0.625},
    "1-1/4":{O:135,tf:20.7,X:64,A:42.2,Y:67,BC:98.4,n:4,holeDia:0.75,boltDia:0.625},
    "1-1/2":{O:155,tf:22.3,X:70,A:48.3,Y:70,BC:114.3,n:4,holeDia:0.875,boltDia:0.75},
    "2":{O:165,tf:25.4,X:84,A:60.3,Y:73,BC:127.0,n:8,holeDia:0.75,boltDia:0.625},
    "2-1/2":{O:190,tf:28.6,X:100,A:73.0,Y:79,BC:149.2,n:8,holeDia:0.875,boltDia:0.75},
    "3":{O:210,tf:31.8,X:117,A:88.9,Y:83,BC:168.3,n:8,holeDia:0.875,boltDia:0.75},
    "3-1/2":{O:230,tf:35.0,X:133,A:101.6,Y:86,BC:184.2,n:8,holeDia:1,boltDia:0.875},
    "4":{O:275,tf:38.1,X:152,A:114.3,Y:102,BC:215.9,n:8,holeDia:1,boltDia:0.875},
    "5":{O:330,tf:44.5,X:189,A:141.3,Y:114,BC:266.7,n:8,holeDia:1.125,boltDia:1},
    "6":{O:355,tf:47.7,X:222,A:168.3,Y:117,BC:292.1,n:12,holeDia:1.125,boltDia:1},
    "8":{O:420,tf:55.6,X:273,A:219.1,Y:133,BC:349.2,n:12,holeDia:1.25,boltDia:1.125},
    "10":{O:510,tf:63.5,X:343,A:273.0,Y:152,BC:431.8,n:16,holeDia:1.375,boltDia:1.25},
    "12":{O:560,tf:66.7,X:400,A:323.8,Y:156,BC:489.0,n:20,holeDia:1.375,boltDia:1.25},
    "14":{O:605,tf:69.9,X:432,A:355.6,Y:165,BC:527.0,n:20,holeDia:1.5,boltDia:1.375},
    "16":{O:685,tf:76.2,X:495,A:406.4,Y:178,BC:603.2,n:20,holeDia:1.625,boltDia:1.5},
    "18":{O:745,tf:82.6,X:546,A:457.0,Y:184,BC:654.0,n:20,holeDia:1.75,boltDia:1.625},
    "20":{O:815,tf:88.9,X:610,A:508.0,Y:190,BC:723.9,n:24,holeDia:1.75,boltDia:1.625},
    "24":{O:940,tf:101.6,X:718,A:610.0,Y:203,BC:838.2,n:24,holeDia:2,boltDia:1.875}
  },
  "900":{
    "1/2":{O:120,tf:22.3,X:38,A:21.3,Y:60,BC:82.6,n:4,holeDia:0.875,boltDia:0.75},
    "3/4":{O:130,tf:25.4,X:44,A:26.7,Y:70,BC:88.9,n:4,holeDia:0.875,boltDia:0.75},
    "1":{O:150,tf:28.6,X:52,A:33.4,Y:73,BC:101.6,n:4,holeDia:1,boltDia:0.875},
    "1-1/4":{O:160,tf:28.6,X:64,A:42.2,Y:73,BC:111.1,n:4,holeDia:1,boltDia:0.875},
    "1-1/2":{O:180,tf:31.8,X:70,A:48.3,Y:83,BC:123.8,n:4,holeDia:1.125,boltDia:1},
    "2":{O:215,tf:38.1,X:105,A:60.3,Y:102,BC:165.1,n:8,holeDia:1,boltDia:0.875},
    "2-1/2":{O:245,tf:41.3,X:124,A:73.0,Y:105,BC:190.5,n:8,holeDia:1.125,boltDia:1},
    "3":{O:240,tf:38.1,X:127,A:88.9,Y:102,BC:190.5,n:8,holeDia:1,boltDia:0.875},
    "4":{O:290,tf:44.5,X:159,A:114.3,Y:114,BC:235.0,n:8,holeDia:1.25,boltDia:1.125},
    "5":{O:350,tf:50.8,X:190,A:141.3,Y:127,BC:279.4,n:8,holeDia:1.375,boltDia:1.25},
    "6":{O:380,tf:55.6,X:235,A:168.3,Y:140,BC:317.5,n:12,holeDia:1.25,boltDia:1.125},
    "8":{O:470,tf:63.5,X:298,A:219.1,Y:162,BC:393.7,n:12,holeDia:1.5,boltDia:1.375},
    "10":{O:545,tf:69.9,X:368,A:273.0,Y:184,BC:469.9,n:16,holeDia:1.5,boltDia:1.375},
    "12":{O:610,tf:79.4,X:419,A:323.8,Y:200,BC:533.4,n:20,holeDia:1.5,boltDia:1.375},
    "14":{O:640,tf:85.8,X:451,A:355.6,Y:213,BC:558.8,n:20,holeDia:1.625,boltDia:1.5},
    "16":{O:705,tf:88.9,X:508,A:406.4,Y:216,BC:616.0,n:20,holeDia:1.75,boltDia:1.625},
    "18":{O:785,tf:101.6,X:565,A:457.0,Y:229,BC:685.8,n:20,holeDia:2,boltDia:1.875},
    "20":{O:855,tf:108.0,X:622,A:508.0,Y:248,BC:749.3,n:20,holeDia:2.125,boltDia:2},
    "24":{O:1040,tf:139.7,X:749,A:610.0,Y:292,BC:901.7,n:20,holeDia:2.625,boltDia:2.5}
  },
  "1500":{
    "1/2":{O:120,tf:22.3,X:38,A:21.3,Y:60,BC:82.6,n:4,holeDia:0.875,boltDia:0.75},
    "3/4":{O:130,tf:25.4,X:44,A:26.7,Y:70,BC:88.9,n:4,holeDia:0.875,boltDia:0.75},
    "1":{O:150,tf:28.6,X:52,A:33.4,Y:73,BC:101.6,n:4,holeDia:1,boltDia:0.875},
    "1-1/4":{O:160,tf:28.6,X:64,A:42.2,Y:73,BC:111.1,n:4,holeDia:1,boltDia:0.875},
    "1-1/2":{O:180,tf:31.8,X:70,A:48.3,Y:83,BC:123.8,n:4,holeDia:1.125,boltDia:1},
    "2":{O:215,tf:38.1,X:105,A:60.3,Y:102,BC:165.1,n:8,holeDia:1,boltDia:0.875},
    "2-1/2":{O:245,tf:41.3,X:124,A:73.0,Y:105,BC:190.5,n:8,holeDia:1.125,boltDia:1},
    "3":{O:265,tf:47.7,X:133,A:88.9,Y:117,BC:203.2,n:8,holeDia:1.25,boltDia:1.125},
    "4":{O:310,tf:54.0,X:162,A:114.3,Y:124,BC:241.3,n:8,holeDia:1.375,boltDia:1.25},
    "5":{O:375,tf:73.1,X:197,A:141.3,Y:156,BC:292.1,n:8,holeDia:1.625,boltDia:1.5},
    "6":{O:395,tf:82.6,X:229,A:168.3,Y:171,BC:317.5,n:12,holeDia:1.5,boltDia:1.375},
    "8":{O:485,tf:92.1,X:292,A:219.1,Y:213,BC:393.7,n:12,holeDia:1.75,boltDia:1.625},
    "10":{O:585,tf:108.0,X:368,A:273.0,Y:254,BC:482.6,n:12,holeDia:2,boltDia:1.875},
    "12":{O:675,tf:123.9,X:451,A:323.8,Y:283,BC:571.5,n:16,holeDia:2.125,boltDia:2},
    "14":{O:750,tf:133.4,X:495,A:355.6,Y:298,BC:635.0,n:16,holeDia:2.375,boltDia:2.25},
    "16":{O:825,tf:146.1,X:552,A:406.4,Y:311,BC:704.8,n:16,holeDia:2.625,boltDia:2.5},
    "18":{O:915,tf:162.0,X:597,A:457.0,Y:327,BC:774.7,n:16,holeDia:2.875,boltDia:2.75},
    "20":{O:985,tf:177.8,X:641,A:508.0,Y:356,BC:831.8,n:16,holeDia:3.125,boltDia:3},
    "24":{O:1170,tf:203.2,X:762,A:610.0,Y:406,BC:990.6,n:16,holeDia:3.625,boltDia:3.5}
  },
  "2500":{
    "1/2":{O:135,tf:30.2,X:43,A:21.3,Y:73,BC:88.9,n:4,holeDia:0.875,boltDia:0.75},
    "3/4":{O:140,tf:31.8,X:51,A:26.7,Y:79,BC:95.2,n:4,holeDia:0.875,boltDia:0.75},
    "1":{O:160,tf:35.0,X:57,A:33.4,Y:89,BC:108.0,n:4,holeDia:1,boltDia:0.875},
    "1-1/4":{O:185,tf:38.1,X:73,A:42.2,Y:95,BC:130.2,n:4,holeDia:1.125,boltDia:1},
    "1-1/2":{O:205,tf:44.5,X:79,A:48.3,Y:111,BC:146.0,n:4,holeDia:1.25,boltDia:1.125},
    "2":{O:235,tf:50.9,X:95,A:60.3,Y:127,BC:171.4,n:8,holeDia:1.125,boltDia:1},
    "2-1/2":{O:265,tf:57.2,X:114,A:73.0,Y:143,BC:196.8,n:8,holeDia:1.25,boltDia:1.125},
    "3":{O:305,tf:66.7,X:133,A:88.9,Y:168,BC:228.6,n:8,holeDia:1.375,boltDia:1.25},
    "4":{O:355,tf:76.2,X:165,A:114.3,Y:190,BC:273.0,n:8,holeDia:1.625,boltDia:1.5},
    "5":{O:420,tf:92.1,X:203,A:141.3,Y:229,BC:323.8,n:8,holeDia:1.875,boltDia:1.75},
    "6":{O:485,tf:108.0,X:235,A:168.3,Y:273,BC:368.3,n:8,holeDia:2.125,boltDia:2},
    "8":{O:550,tf:127.0,X:305,A:219.1,Y:318,BC:438.2,n:12,holeDia:2.125,boltDia:2},
    "10":{O:675,tf:165.1,X:375,A:273.0,Y:419,BC:539.8,n:12,holeDia:2.625,boltDia:2.5},
    "12":{O:760,tf:184.2,X:441,A:323.8,Y:464,BC:619.1,n:12,holeDia:2.875,boltDia:2.75}
  }
};

/* convenience lookup: B16_5get('300','6') -> record or null */
function b165Get(cls, nps){
  return (B16_5[cls] && B16_5[cls][nps]) ? B16_5[cls][nps] : null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { B16_5, b165Get };
}
