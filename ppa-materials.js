/* =====================================================================
   ppa-materials.js  —  PipingPro Academy shared material library  v2.0
   ---------------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for the Material Property Datasheet (md),
   Material Comparison calculator, and all PPA calculators.

   BASE UNITS: US Customary (canonical, matching ASME B31.3 Table A-1).
     Stress (Sh, SMYS, SMTS) .... ksi
     Temperature (t, tmin) ....... °F
     Modulus E ................... ×10⁶ psi  (lookup via E_GROUPS[eGrp])
     Thermal expansion α ......... ×10⁻⁶ in./in./°F  (lookup via A_GROUPS[aGrp])
   SI display is derived deterministically (see PPA.convert).

   ARCHITECTURE:
     MATERIALS ........... Allowable stress + material identification (Table A-1)
     E_GROUPS ............ Modulus of elasticity by material group (Table C-6)
     A_GROUPS ............ Mean thermal expansion by material group (Table C-1)
     EJ .................. Longitudinal weld joint quality factor (Table A-1B)
     EC .................. Casting quality factor (Table A-1A)
     RHO / COST / WELD ... Supplementary data (unchanged from v1)
     ASTM_SPECS .......... Specification full names (unchanged)
     TABLE_A1_NOTES ...... Table A-1 Notes (unchanged)
     interp / convert .... Interpolation and unit conversion utilities

   Each material entry carries eGrp and aGrp keys that index into
   E_GROUPS and A_GROUPS respectively. This mirrors B31.3's structure
   where Tables C-6 and C-1 are material-group-based, not per-material.

   Usage:
     const mat = PPA.MATERIALS['A106B'];
     const Sh  = PPA.interp(mat.sh, mat.t, 500);           // ksi at 500°F
     const E   = PPA.interp(PPA.E_GROUPS[mat.eGrp].e,
                            PPA.E_GROUPS[mat.eGrp].t, 500); // ×10⁶ psi
     const a   = PPA.interp(PPA.A_GROUPS[mat.aGrp].a,
                            PPA.A_GROUPS[mat.aGrp].t, 500); // ×10⁻⁶/°F
   ===================================================================== */
(function (g) {
  "use strict";

  /* ---- TABLE A-1: Basic Allowable Stresses (US Customary) ---- */
  const MATERIALS = {
    "A53AF":{ name:"A53 A", subCat:"CS Pipe", form:"SMLS, ERW", spec:"A53", grade:"A", uns:"K02504",
      pNo:1, notes:"8a", tmin:20, smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[16,16,16,16] },
    "A139A":{ name:"A139 A", subCat:"CS Pipe", form:"", spec:"A139", grade:"A", uns:"",
      pNo:1, notes:"8b", tmin:"A", smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300],
      sh:[16,16,16] },
    "A587":{ name:"A587", subCat:"CS Pipe", form:"", spec:"A587", grade:"", uns:"K11500",
      pNo:1, notes:"57, 59", tmin:-20, smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850],
      sh:[16,16,16,16,16,15.3,14.6,12.5,10.7,9.2,7.9] },
    "A53A":{ name:"A53 A", subCat:"CS Pipe", form:"SMLS, ERW", spec:"A53", grade:"A", uns:"K02504",
      pNo:1, notes:"57, 59", tmin:"B", smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[16,16,16,16,16,15.3,14.6,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A106A":{ name:"A106 A", subCat:"CS Pipe", form:"SMLS", spec:"A106", grade:"A", uns:"K02501",
      pNo:1, notes:"57.0", tmin:"B", smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[16,16,16,16,16,15.3,14.6,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A135A":{ name:"A135 A", subCat:"CS Pipe", form:"Pipe", spec:"A135", grade:"A", uns:"-",
      pNo:1, notes:"57, 59", tmin:"B", smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[16,16,16,16,16,15.3,14.6,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A369FPA":{ name:"A369 FPA", subCat:"CS Pipe", form:"Pipe", spec:"A369", grade:"FPA", uns:"K02501",
      pNo:1, notes:"57.0", tmin:"B", smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[16,16,16,16,16,15.3,14.6,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A134":{ name:"A134 A285B", subCat:"CS Pipe", form:"Pipe", spec:"A134", grade:"A285B", uns:"K02200",
      pNo:1, notes:"8b, 57", tmin:"B", smts:50, smys:27, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[16.7,16.5,15.9,15.4,14.7,13.8,13.3,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A672":{ name:"A672 A50", subCat:"CS Pipe", form:"Pipe", spec:"A672", grade:"A50", uns:"K02200",
      pNo:1, notes:"57,59,67", tmin:"B", smts:50, smys:27, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900],
      sh:[16.7,16.5,15.9,15.4,14.7,13.8,13.3,12.5,10.7,9.2,7.9,5.9] },
    "API5LA":{ name:"API5L A", subCat:"CS Pipe", form:"SMLS, ERW, SAW", spec:"API5L", grade:"A", uns:"-",
      pNo:1, notes:"57, 59", tmin:"B", smts:48, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[16,16,16,16,16,15.3,14.6,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A`134":{ name:"A134 A285C", subCat:"CS Pipe", form:"Pipe", spec:"A134", grade:"A285C", uns:"K02801",
      pNo:1, notes:"8b, 57", tmin:"A", smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900],
      sh:[18.3,18.3,17.7,17.1,16.3,13.8,13.3,12.5,10.7,9.2,7.9,5.9] },
    "A524":{ name:"A524 II", subCat:"CS Pipe", form:"Pipe", spec:"A524", grade:"II", uns:"K02104",
      pNo:1, notes:"57.0", tmin:-20, smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,17.7,17.1,16.3,13.8,13.3,12.5,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A3331":{ name:"A333 1.0", subCat:"CS Tube", form:"Pipe & Tube", spec:"A333", grade:"1.0", uns:"K03008",
      pNo:1, notes:"57.0", tmin:-50, smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A3341":{ name:"A334 1.0", subCat:"CS Tube", form:"Pipe & Tube", spec:"A334", grade:"1.0", uns:"K03008",
      pNo:1, notes:"57, 59", tmin:-50, smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A671":{ name:"A671 CA55", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CA55", uns:"K02801",
      pNo:1, notes:"57,59", tmin:"A", smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A672_1":{ name:"A672 A55", subCat:"CS Pipe", form:"Pipe", spec:"A672", grade:"A55", uns:"K02801",
      pNo:1, notes:"57,59,67", tmin:"A", smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A672_2":{ name:"A672 C55", subCat:"CS Pipe", form:"Pipe", spec:"A672", grade:"C55", uns:"K01800",
      pNo:1, notes:"57,67", tmin:"C", smts:55, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A671_1":{ name:"A671 CC60", subCat:"CS Pipe", form:"Pipe", spec:"A671", grade:"CC60", uns:"K02100",
      pNo:1, notes:"57,67", tmin:"C", smts:60, smys:32, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[20,19.5,18.9,18.2,17.4,16.4,15.8,15.3,13,10.8,8.7,5.9,4,2.5] },
    "A671_2":{ name:"A671 CB60", subCat:"CS Pipe", form:"Pipe", spec:"A671", grade:"CB60", uns:"K02401",
      pNo:1, notes:"57,67", tmin:"B", smts:60, smys:32, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,19.5,18.9,18.2,17.4,16.4,15.8,15.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A672_3":{ name:"A672 B60", subCat:"CS Pipe", form:"Pipe", spec:"A672", grade:"B60", uns:"K02401",
      pNo:1, notes:"57,67", tmin:"B", smts:60, smys:32, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,19.5,18.9,18.2,17.4,16.4,15.8,15.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A672_4":{ name:"A672 C60", subCat:"CS Pipe", form:"Pipe", spec:"A672", grade:"C60", uns:"K02100",
      pNo:1, notes:"57,67", tmin:"C", smts:60, smys:32, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,19.5,18.9,18.2,17.4,16.4,15.8,15.3,13,10.8,8.7,5.9,4,2.5,1.6,1] },
    "A139B":{ name:"A139 B", subCat:"CS Pipe", form:"Pipe", spec:"A139", grade:"B", uns:"K03003",
      pNo:1, notes:"8b", tmin:"A", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300],
      sh:[20,20,20] },
    "A135B":{ name:"A135 B", subCat:"CS Pipe", form:"Pipe", spec:"A135", grade:"B", uns:"K03018",
      pNo:1, notes:"57,59", tmin:"B", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5] },
    "A524I":{ name:"A524 I", subCat:"CS Pipe", form:"Pipe", spec:"A524", grade:"I", uns:"K02104",
      pNo:1, notes:"57.0", tmin:-20, smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5] },
    "A53B":{ name:"A53 B", subCat:"CS Pipe", form:"PIPE", spec:"A53", grade:"B", uns:"K03005",
      pNo:1, notes:"57, 59", tmin:"B", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A106B":{ name:"A106 B", subCat:"CS Pipe", form:"PIPE", spec:"A106", grade:"B", uns:"K03006",
      pNo:1, notes:"57.0", tmin:"B", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A3336":{ name:"A333 6.0", subCat:"CS Pipe", form:"PIPE", spec:"A333", grade:"6.0", uns:"K03006",
      pNo:1, notes:"57.0", tmin:-50, smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A3346":{ name:"A334 6.0", subCat:"CS Pipe", form:"PIPE", spec:"A334", grade:"6.0", uns:"K03006",
      pNo:1, notes:"57.0", tmin:-50, smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A369FPB":{ name:"A369 FPB", subCat:"CS Pipe", form:"PIPE", spec:"A369", grade:"FPB", uns:"K03006",
      pNo:1, notes:"57.0", tmin:-20, smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A381Y35":{ name:"A381 Y35", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y35", uns:"",
      pNo:1, notes:"-", tmin:"A", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "API5LB":{ name:"API5L B", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"B", uns:"",
      pNo:1, notes:"57, 59, 77", tmin:"B", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A139C":{ name:"A139 C", subCat:"CS Pipe", form:"PIPE", spec:"A139", grade:"C", uns:"K03004",
      pNo:1, notes:"8b", tmin:"A", smts:60, smys:42, eGrp:"CS", aGrp:"Grp1",
      t:[100,200],
      sh:[20,20] },
    "A139D":{ name:"A139 D", subCat:"CS Pipe", form:"PIPE", spec:"A139", grade:"D", uns:"K03010",
      pNo:1, notes:"8b", tmin:"A", smts:60, smys:46, eGrp:"CS", aGrp:"Grp1",
      t:[100,200],
      sh:[20,20] },
    "API5LX42":{ name:"API5L X42", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X42", uns:"",
      pNo:1, notes:"55, 77", tmin:"A", smts:60, smys:42, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[20,20,20,20] },
    "A381Y42":{ name:"A381 Y42", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y42", uns:"",
      pNo:1, notes:"", tmin:"A", smts:60, smys:42, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[20,20,20,20] },
    "A381Y48":{ name:"A381 Y48", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y48", uns:"",
      pNo:1, notes:"", tmin:"A", smts:62, smys:48, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650],
      sh:[20.7,20.7,20.7,20.7,20.7,20.7,20.7] },
    "API5LX46":{ name:"API5L X46", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X46", uns:"",
      pNo:1, notes:"55, 77", tmin:"A", smts:63, smys:46, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[21,21,21,21] },
    "A381Y46":{ name:"A381 Y46", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y46", uns:"",
      pNo:1, notes:"", tmin:"A", smts:63, smys:46, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[21,21,21,21] },
    "A381Y50":{ name:"A381 Y50", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y50", uns:"",
      pNo:1, notes:"", tmin:"A", smts:64, smys:50, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650],
      sh:[21.3,21.3,21.3,21.3,21.3,21.3,21.3] },
    "A671CC65":{ name:"A671 CC65", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CC65", uns:"K02403",
      pNo:1, notes:"57, 67", tmin:"B", smts:65, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[21.7,21.4,20.6,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5] },
    "A671CB65":{ name:"A671 CB65", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CB65", uns:"K02800",
      pNo:1, notes:"57, 67", tmin:"B", smts:65, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A672B65":{ name:"A672 B65", subCat:"CS Pipe", form:"PIPE", spec:"A672", grade:"B65", uns:"K02800",
      pNo:1, notes:"57, 67", tmin:"B", smts:65, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A672C65":{ name:"A672 C65", subCat:"CS Pipe", form:"PIPE", spec:"A672", grade:"C65", uns:"K02403",
      pNo:1, notes:"57, 67", tmin:"B", smts:65, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A139E":{ name:"A139 E", subCat:"CS Pipe", form:"PIPE", spec:"A139", grade:"E", uns:"K03012",
      pNo:1, notes:"8b", tmin:"A", smts:66, smys:52, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300],
      sh:[22,22,22] },
    "API5LX52":{ name:"API5L X52", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X52", uns:"",
      pNo:1, notes:"55, 77", tmin:"A", smts:66, smys:52, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[22,22,22,22] },
    "A318Y52":{ name:"A381 Y52", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y52", uns:"",
      pNo:1, notes:"", tmin:"A", smts:66, smys:52, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[22,22,22,22] },
    "A671CC70":{ name:"A671 CC70", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CC70", uns:"K02700",
      pNo:1, notes:"57, 67", tmin:"B", smts:70, smys:38, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[23.3,23.2,22.4,21.6,20.6,19.4,18.8,18.1,14.8,12,9.3,6.7,4,2.5] },
    "A671CB70":{ name:"A671 CB70", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CB70", uns:"K03101",
      pNo:1, notes:"57, 67", tmin:"B", smts:70, smys:38, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,23.2,22.4,21.6,20.6,19.4,18.8,18.1,14.8,12,9.3,6.7,4,2.5,1.6,1] },
    "A672B70":{ name:"A672 B70", subCat:"CS Pipe", form:"PIPE", spec:"A672", grade:"B70", uns:"K03101",
      pNo:1, notes:"57, 67", tmin:"B", smts:70, smys:38, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,23.2,22.4,21.6,20.6,19.4,18.8,18.1,14.8,12,9.3,6.7,4,2.5,1.6,1] },
    "A672C70":{ name:"A672 C70", subCat:"CS Pipe", form:"PIPE", spec:"A672", grade:"C70", uns:"K02700",
      pNo:1, notes:"57, 67", tmin:"B", smts:70, smys:38, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,23.2,22.4,21.6,20.6,19.4,18.8,18.1,14.8,12,9.3,6.7,4,2.5,1.6,1] },
    "A106C":{ name:"A106 C", subCat:"CS Pipe", form:"PIPE", spec:"A106", grade:"C", uns:"K03501",
      pNo:1, notes:"57.0", tmin:"B", smts:70, smys:40, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800],
      sh:[23.3,23.3,23.2,22.8,21.7,20.4,19.8,18.3,14.8,12] },
    "A671CD70":{ name:"A671 CD70", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CD70", uns:"K12437",
      pNo:1, notes:"67.0", tmin:"D", smts:70, smys:50, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700],
      sh:[23.3,23.3,22.8,22.7,22.7,22.4,21.9,18.3] },
    "A671D70":{ name:"A671 D70", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"D70", uns:"K12437",
      pNo:1, notes:"67.0", tmin:"D", smts:70, smys:50, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700],
      sh:[23.3,23.3,22.8,22.7,22.7,22.4,21.9,18.3] },
    "A691CMSH70":{ name:"A691 CMSH-70", subCat:"CS Pipe", form:"PIPE", spec:"A691", grade:"CMSH-70", uns:"K12437",
      pNo:1, notes:"67.0", tmin:"D", smts:70, smys:50, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700],
      sh:[23.3,23.3,22.8,22.7,22.7,22.4,21.9,18.3] },
    "API5LX56":{ name:"API5L X56", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X56", uns:"",
      pNo:1, notes:"51, 55, 71, 77", tmin:"A", smts:71, smys:56, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[23.7,23.7,23.7,23.7] },
    "A318Y56":{ name:"A381 Y56", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y56", uns:"",
      pNo:1, notes:"51,55,71", tmin:"A", smts:71, smys:56, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[23.7,23.7,23.7,23.7] },
    "A671CK75":{ name:"A671 CK75", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CK75", uns:"K02803",
      pNo:1, notes:"57,67", tmin:"A", smts:75, smys:40, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[25,24.4,23.6,22.8,21.7,20.4,19.8,19.1,15.7,12.6,9.3,6.7,4,2.5,1.6,1] },
    "A672N75":{ name:"A672 N75", subCat:"CS Pipe", form:"PIPE", spec:"A672", grade:"N75", uns:"K02803",
      pNo:1, notes:"57,67", tmin:"A", smts:75, smys:40, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[25,24.4,23.6,22.8,21.7,20.4,19.8,19.1,15.7,12.6,9.3,6.7,4,2.5,1.6,1] },
    "A691CMS75":{ name:"A691 CMS-75", subCat:"CS Pipe", form:"PIPE", spec:"A691", grade:"CMS-75", uns:"K02803",
      pNo:1, notes:"57,67", tmin:"A", smts:75, smys:40, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[25,24.4,23.6,22.8,21.7,20.4,19.8,19.1,15.7,12.6,9.3,6.7,4,2.5,1.6,1] },
    "A671CK75_1":{ name:"A671 CK75", subCat:"CS Pipe", form:"PIPE", spec:"A671", grade:"CK75", uns:"K02803",
      pNo:1, notes:"57,67", tmin:"A", smts:75, smys:42, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700],
      sh:[25,25,24.8,23.9,22.8,21.5,20.8,19.6] },
    "A672N75_1":{ name:"A672 N75", subCat:"CS Pipe", form:"PIPE", spec:"A672", grade:"N75", uns:"K02803",
      pNo:1, notes:"57,67", tmin:"A", smts:75, smys:42, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700],
      sh:[25,25,24.8,23.9,22.8,21.5,20.8,19.6] },
    "A691CMS75_1":{ name:"A691 CMS-75", subCat:"CS Pipe", form:"PIPE", spec:"A691", grade:"CMS-75", uns:"K02803",
      pNo:1, notes:"57,67", tmin:"A", smts:75, smys:42, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700],
      sh:[25,25,24.8,23.9,22.8,21.5,20.8,19.6] },
    "API5LX60":{ name:"API5L X60", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X60", uns:"",
      pNo:1, notes:"51, 55, 71, 77", tmin:"A", smts:75, smys:60, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[25,25,25,25] },
    "API5LX65":{ name:"API5L X65", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X65", uns:"",
      pNo:1, notes:"51, 55, 71, 77", tmin:"A", smts:77, smys:65, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[25.7,25.7,25.7,25.7] },
    "API5LX70":{ name:"API5L X70", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X70", uns:"",
      pNo:1, notes:"51, 55, 71, 77", tmin:"A", smts:82, smys:70, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[27.3,27.3,27.3,27.3] },
    "API5LX80":{ name:"API5L X80", subCat:"CS Pipe", form:"PIPE", spec:"API5L", grade:"X80", uns:"",
      pNo:1, notes:"51, 55, 71, 77", tmin:"A", smts:90, smys:80, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[30,30,30,30] },
    "A318Y60":{ name:"A381 Y60", subCat:"CS Pipe", form:"PIPE", spec:"A381", grade:"Y60", uns:"",
      pNo:1, notes:"51,71", tmin:"A", smts:75, smys:60, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400],
      sh:[25,25,25,25] },
    "A335P2":{ name:"A335 P2", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P2", uns:"K11547",
      pNo:3, notes:"-", tmin:-20, smts:55, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[18.3,18.3,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.6,13.9,9.2,5.9] },
    "A691":{ name:"A691 Cr", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"Cr", uns:"K12143",
      pNo:3, notes:"11,67", tmin:-20, smts:55, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[18.3,18.3,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.6,13.9,9.2,5.9] },
    "A335P1":{ name:"A335 P1", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P1", uns:"K11522",
      pNo:3, notes:"58.0", tmin:-20, smts:55, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.7,8.2,4.8,4,2.4] },
    "A369FP1":{ name:"A369 FP1", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP1", uns:"K11522",
      pNo:3, notes:"58.0", tmin:-20, smts:55, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.7,8.2,4.8,4,2.4] },
    "A369FP2":{ name:"A369 FP2", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP2", uns:"K11547",
      pNo:3, notes:"-", tmin:-20, smts:55, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.7,8.2,4.8,4,2.4] },
    "A6911CR":{ name:"A691 1CR", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"1CR", uns:"K11757",
      pNo:4, notes:"11,67", tmin:-20, smts:55, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[18.3,18.3,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.7,8.2,4.8,4,2.4] },
    "A426CP21":{ name:"A426 CP2", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP2", uns:"J11547",
      pNo:3, notes:"10.0", tmin:-20, smts:60, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,18.8,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.9,9.2,5.9,4,2.4] },
    "A335P15":{ name:"A335 P15", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P15", uns:"K11578",
      pNo:3, notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,18.8,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.9,9.2,5.9,4,2.4] },
    "A426CP15":{ name:"A426 CP15", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP15", uns:"J11522",
      pNo:3, notes:"10.0", tmin:-20, smts:60, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,18.8,18,17.4,16.9,16.4,16.1,15.7,15.4,14.9,14.5,13.9,9.2,5.9,4,2.4] },
    "A426CP12":{ name:"A426 CP12", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP12", uns:"J11562",
      pNo:4, notes:"10.0", tmin:-20, smts:60, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.8,17,16.2,15.7,15.2,15,14.8,14.6,14.3,14,13.6,11.3,7.2,4.5,2.8,1.8,1.1] },
    "A426CP5b":{ name:"A426 CP5b", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP5b", uns:"J51545",
      pNo:"5B", notes:"10.0", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.8,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A426CP21_1":{ name:"A426 CP21", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP21", uns:"J31545",
      pNo:"5A", notes:"10.0", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.8,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,16,2,9,7,5.5,4,2.7,1.5] },
    "A3334":{ name:"A333 4.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A333", grade:"4.0", uns:"K11267",
      pNo:4, notes:"-", tmin:-150, smts:60, smys:35, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650],
      sh:[20,19.1,18.2,17.3,16.4,15.5,15] },
    "A369FP12":{ name:"A369 FP12", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP12", uns:"K11562",
      pNo:4, notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,17.5,12.5,10,6.2,4.2,2.6,1.4,1] },
    "A335P12":{ name:"A335 P11", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P11", uns:"K11562",
      pNo:4, notes:"-", tmin:-20, smts:60, smys:32, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,19.3,18.1,17.3,16.7,16.3,16,15.8,15.5,15.3,14.9,14.5,11.3,7.2,4.5,2.8,1.8,1.1] },
    "A369FP12_1":{ name:"A369 FP11", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP11", uns:"K11562",
      pNo:4, notes:"-", tmin:-20, smts:60, smys:32, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,19.3,18.1,17.3,16.7,16.3,16,15.8,15.5,15.3,14.9,14.5,11.3,7.2,4.5,2.8,1.8,1.1] },
    "A335P11":{ name:"A335 P11", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P11", uns:"K11597",
      pNo:4, notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.5,17.6,16.8,16.2,15.7,15.4,15.1,14.8,14.4,14,13.6,9.3,6.3,4.2,2.8,1.9,1.2] },
    "A369FP11":{ name:"A369 FP11", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP11", uns:"K11597",
      pNo:4, notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.5,17.6,16.8,16.2,15.7,15.4,15.1,14.8,14.4,14,13.6,9.3,6.3,4.2,2.8,1.9,1.2] },
    "A691_1":{ name:"A691 1 1/4 Cr", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"1 1/4 Cr", uns:"K11789",
      pNo:"1 1/4 CR", notes:"-", tmin:-20, smts:60, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,20,20,19.6,18.9,18.3,18,17.6,17.2,16.8,16.4,13.7,9.3,6.3,4.2,2.8,1.9,1.2] },
    "A691_2":{ name:"A691 5CR", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"5CR", uns:"K41545",
      pNo:"5CR", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A335P5":{ name:"A335 P5", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P5", uns:"K41545",
      pNo:"5B", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A335P5b":{ name:"A335 P5b", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P5b", uns:"K41545",
      pNo:"5B", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A335P5c":{ name:"A335 P5c", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P5c", uns:"K41545",
      pNo:"5B", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A335FP5":{ name:"A335 FP5", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"FP5", uns:"K41545",
      pNo:"5B", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A335P9":{ name:"A335 P9", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P9", uns:"K90941",
      pNo:"5B", notes:"", tmin:-20, smts:60, smys:30, eGrp:"CrMo_9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.8,14.1,10.6,7.4,5,3.3,2.2,1.5] },
    "A335FP9":{ name:"A335 P9", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P9", uns:"K90941",
      pNo:"5B", notes:"", tmin:-20, smts:60, smys:30, eGrp:"CrMo_9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.8,14.1,10.6,7.4,5,3.3,2.2,1.5] },
    "A3359CR":{ name:"A335 P9", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P9", uns:"K90941",
      pNo:"5B", notes:"11,67", tmin:-20, smts:60, smys:30, eGrp:"CrMo_9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.8,14.1,10.6,7.4,5,3.3,2.2,1.5] },
    "A335P21":{ name:"A335 P21", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P21", uns:"K31545",
      pNo:"5A", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,16,12,9,7,5.5,4,2.7,1.5] },
    "A369FP21":{ name:"A369 FP21", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP21", uns:"K31545",
      pNo:"5A", notes:"-", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,16,12,9,7,5.5,4,2.7,1.5] },
    "A6913CR":{ name:"A691 3CR", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"3CR", uns:"K31545",
      pNo:"5A", notes:"11,67", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.5,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,16,12,9,7,5.5,4,2.7,1.5] },
    "A691 2 1/4 CR":{ name:"A691 2 1/4 CR", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"2 1/4 CR", uns:"K21590",
      pNo:"5A", notes:"11,67,72,75", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,17.1,13.6,10.8,8,5.7,3.8,2.4,1.4] },
    "A369FP22":{ name:"A369 FP22", subCat:"Alloy Pipe", form:"PIPE", spec:"A369", grade:"FP22", uns:"K21590",
      pNo:"5A", notes:"`", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,17.1,13.6,10.8,8,5.7,3.8,2.4,1.4] },
    "A335P22":{ name:"A335 P22", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P22", uns:"K21590",
      pNo:"5A", notes:"72, 75", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,17.1,13.6,10.8,8,5.7,3.8,2.4,1.4] },
    "A3339":{ name:"A333 9.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A333", grade:"9.0", uns:"K22035",
      pNo:"9A", notes:"-", tmin:-100, smts:63, smys:46, eGrp:"CrMo", aGrp:"Grp2",
      t:[100],
      sh:[21] },
    "A3349":{ name:"A334 9.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A334", grade:"9.0", uns:"K22035",
      pNo:"9A", notes:"-", tmin:-100, smts:63, smys:46, eGrp:"CrMo", aGrp:"Grp2",
      t:[100],
      sh:[21] },
    "A3337":{ name:"A333 7.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A333", grade:"7.0", uns:"K21903",
      pNo:"9A", notes:"-", tmin:-150, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,18.9,17.5,16.7,15.7,13.9,11.4,9,6.5,4.5,2.5,1.6,1] },
    "A3347":{ name:"A334 7.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A334", grade:"7.0", uns:"K21903",
      pNo:"9A", notes:"-", tmin:-150, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,18.9,17.5,16.7,15.7,13.9,11.4,9,6.5,4.5,2.5,1.6,1] },
    "A3333":{ name:"A333 3.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A333", grade:"3.0", uns:"K31918",
      pNo:"9B", notes:"-", tmin:-150, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,18.9,17.5,16.7,15.7,13.9,11.4,9,6.5,4.5,2.5,1.6,1] },
    "A3343":{ name:"A334 3.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A334", grade:"3.0", uns:"K31918",
      pNo:"9B", notes:"-", tmin:-150, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.4,20.6,19.9,18.9,17.5,16.7,15.7,13.9,11.4,9,6.5,4.5,2.5,1.6,1] },
    "A426CP1":{ name:"A426 CP1", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP1", uns:"J12521",
      pNo:3, notes:"10,58", tmin:-20, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.7,21,20.3,19.7,19.1,18.7,18.4,17.9,17.4,16.9,13.7,8.2,4.8,4,2.4] },
    "A672L65":{ name:"A672 L65", subCat:"Alloy Pipe", form:"PIPE", spec:"A672", grade:"L65", uns:"K11820",
      pNo:3, notes:"11,58,67", tmin:-20, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.7,21,20.3,19.7,19.1,18.7,18.4,17.9,17.4,16.9,13.7,8.2,4.8,4,2.4] },
    "A672CM65":{ name:"A672 CM-65", subCat:"Alloy Pipe", form:"PIPE", spec:"A672", grade:"CM-65", uns:"K11820",
      pNo:3, notes:"11,58,67", tmin:-20, smts:65, smys:35, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[21.7,21.7,21,20.3,19.7,19.1,18.7,18.4,17.9,17.4,16.9,13.7,8.2,4.8,4,2.4] },
    "A671CFB70":{ name:"A671 CFB70", subCat:"Alloy Pipe", form:"PIPE", spec:"A671", grade:"CFB70", uns:"K22103",
      pNo:"9A", notes:"11,65,67", tmin:-20, smts:70, smys:40, eGrp:"CrMo", aGrp:"Grp2",
      t:[100],
      sh:[23.3] },
    "A671CFE70":{ name:"A671 CFE70", subCat:"Alloy Pipe", form:"PIPE", spec:"A671", grade:"CFE70", uns:"K32018",
      pNo:"9B", notes:"11,65,67", tmin:-20, smts:70, smys:40, eGrp:"CrMo", aGrp:"Grp2",
      t:[100],
      sh:[23.3] },
    "A672L70":{ name:"A672 L70", subCat:"Alloy Pipe", form:"PIPE", spec:"A672", grade:"L70", uns:"K12020",
      pNo:3, notes:"11,58,67", tmin:-20, smts:70, smys:40, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,23.3,23.3,23.2,22.5,21.8,21.4,21,20.5,19.9,19.3,13.7,8.2,4.8,4,2.4] },
    "A691CM-70":{ name:"A691 CM-70", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"CM-70", uns:"K12020",
      pNo:3, notes:"11,58,67", tmin:-20, smts:70, smys:40, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,23.3,23.3,23.2,22.5,21.8,21.4,21,20.5,19.9,19.3,13.7,8.2,4.8,4,2.4] },
    "A426CP11":{ name:"A426 CP11", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP11", uns:"J12072",
      pNo:5, notes:"10.0", tmin:-20, smts:70, smys:40, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[23.3,23.3,23.3,22.5,21.7,20.9,20.5,20.1,19.7,19.2,18.7,13.7,9.3,6.3,4.2,2.8,1.9,1.2] },
    "A426CP22":{ name:"A426 CP22", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP22", uns:"J21890",
      pNo:"5A", notes:"10.72", tmin:-20, smts:70, smys:40, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[23.3,23.3,22.6,22.6,22.6,22.6,22.6,22.6,22.6,22.6,21.9,15.8,11.4,7.8,5.1,3.2,2,1.2] },
    "A672L75":{ name:"A672 L75", subCat:"Alloy Pipe", form:"PIPE", spec:"A672", grade:"L75", uns:"K12320",
      pNo:3, notes:"11,58,67", tmin:-20, smts:75, smys:43, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[25,25,25,25,24.2,23.4,23,22.6,22,21.4,20.7,13.7,8.2,4.8,4,2.4] },
    "A691CM-75":{ name:"A691 CM-75", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"CM-75", uns:"K12320",
      pNo:3, notes:"11,58,67", tmin:-20, smts:75, smys:43, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[25,25,25,25,24.2,23.4,23,22.6,22,21.4,20.7,13.7,8.2,4.8,4,2.4] },
    "A335P91":{ name:"A335 P91", subCat:"Alloy Pipe", form:"PIPE", spec:"A335", grade:"P91", uns:"K90901",
      pNo:"15E", notes:"", tmin:-20, smts:85, smys:60, eGrp:"CrMo_9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[28.3,28.3,28.3,28.2,28.1,27.7,27.3,26.7,25.9,24.9,23.7,22.3,20.7,18,14,10.3,7,4.3] },
    "A69191":{ name:"A691 91.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A691", grade:"91.0", uns:"K90901",
      pNo:"15E", notes:"11,67", tmin:-20, smts:85, smys:60, eGrp:"CrMo_9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[28.3,28.3,28.3,28.2,28.1,27.7,27.3,26.7,25.9,24.9,23.7,22.3,20.7,18,14,10.3,7,4.3] },
    "A426CP5":{ name:"A426 CP5", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP5", uns:"J42045",
      pNo:"5B", notes:"10.0", tmin:-20, smts:90, smys:60, eGrp:"CrMo_2Cr3Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[30,29.9,29.1,28.8,28.7,28.3,27.9,27.3,26.5,25.5,24.2,16.4,11,7.4,5,3.3,2.2,1.5] },
    "A426CP9":{ name:"A426 CP9", subCat:"Alloy Pipe", form:"PIPE", spec:"A426", grade:"CP9", uns:"J82090",
      pNo:"5B", notes:"10.0", tmin:-20, smts:90, smys:60, eGrp:"CrMo_2Cr3Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[30,29.9,29.1,28.8,28.7,28.3,27.9,27.3,26.5,25.5,24.2,16.4,11,7.4,5,3.3,2.2,1.5] },
    "A3338":{ name:"A333 8.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A333", grade:"8.0", uns:"K81340",
      pNo:"11A", notes:"47.0", tmin:-320, smts:100, smys:75, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200],
      sh:[33.3,33.3] },
    "A3348":{ name:"A334 8.0", subCat:"Alloy Pipe", form:"PIPE", spec:"A334", grade:"8.0", uns:"K81340",
      pNo:"11A", notes:"-", tmin:-320, smts:100, smys:75, eGrp:"CrMo", aGrp:"Grp2",
      t:[100,200],
      sh:[33.3,33.3] },
    "A312TP321":{ name:"A312 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A312", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28.0", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,16.7,16.1,15.2,14.9,14.6,14.3,14.1,13.9,13.8,13.6,13.5,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A376TP321":{ name:"A376 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A376", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28.36", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,16.7,16.1,15.2,14.9,14.6,14.3,14.1,13.9,13.8,13.6,13.5,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A312TP304L":{ name:"A312 TP304L", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP304L", uns:"S30403",
      pNo:8, notes:"-", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,15.8,14.7,14,13.7,13.5,13.3,13,12.8,12.6,12.3,12,6.3,5.1,4,3.2,2.6,2.1,1.7,1.1,1,0.9] },
    "A358304L":{ name:"A358 304L", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"304L", uns:"S30403",
      pNo:8, notes:"36.0", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,15.8,14.7,14,13.7,13.5,13.3,13,12.8,12.6,12.3,12,6.3,5.1,4,3.2,2.6,2.1,1.7,1.1,1,0.9] },
    "A312TP316L":{ name:"A312 TP316L", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP316L", uns:"S31603",
      pNo:8, notes:"", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,15.7,14.8,14,13.7,13.5,13.2,12.9,12.7,12.4,12.1,11.8,11.6,11.4,8.8,6.4,4.7,3.5,2.5,1.8,1.3,1] },
    "A358316L":{ name:"A358 316L", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"316L", uns:"S31603",
      pNo:8, notes:"36.0", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,15.7,14.8,14,13.7,13.5,13.2,12.9,12.7,12.4,12.1,11.8,11.6,11.4,8.8,6.4,4.7,3.5,2.5,1.8,1.3,1] },
    "A312TP321_1":{ name:"A312 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A312", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28, 30", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,16.7,16.1,15.2,14.9,14.6,14.3,14.1,13.9,13.8,13.6,13.5,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A376TP321_1":{ name:"A376 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A376", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28, 30,36", tmin:-425, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,16.7,16.1,15.2,14.9,14.6,14.3,14.1,13.9,13.8,13.6,13.5,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A312TP321_2":{ name:"A312 TP321H", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A312", grade:"TP321H", uns:"S32109",
      pNo:8, notes:"30.0", tmin:-325, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,16.7,16.1,15.2,14.9,14.6,14.3,14.1,13.9,13.8,13.6,13.5,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A376TP321_2":{ name:"A376 TP321H", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A376", grade:"TP321H", uns:"S32109",
      pNo:8, notes:"30,36", tmin:-325, smts:70, smys:25, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[16.7,16.7,16.7,16.7,16.1,15.2,14.9,14.6,14.3,14.1,13.9,13.8,13.6,13.5,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A451CPH8":{ name:"A451 CPH8", subCat:"SS Pipe", form:"", spec:"A451", grade:"CPH8", uns:"J93400",
      pNo:8, notes:"26,28,35", tmin:-325, smts:65, smys:28, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[18.7,18.7,18.5,18,17.7,17.1,16.7,16.3,15.9,15.4,14.9,14.4,13.9,11.1,8.5,6.5,5,3.8,2.9,2.3,1.8,1.3,0.9,0.8] },
    "A451CPK20":{ name:"A451 CPK20", subCat:"SS Pipe", form:"", spec:"A451", grade:"CPK20", uns:"J94202",
      pNo:8, notes:"12,28,35,39", tmin:-325, smts:65, smys:28, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[18.7,18.7,18.5,18,17.7,17.1,16.7,16.3,15.9,15.4,14.9,14.4,13.9,11.1,8.5,6.5,5,3.8,2.9,2.3,1.8,1.3,0.9,0.8] },
    "A312TP317L":{ name:"A312 TP317L", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP317L", uns:"S31703",
      pNo:8, notes:"-", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850],
      sh:[20,20,20,18.9,17.7,16.9,16.5,16.2,15.8,15.5,15.2] },
    "A312TP310S":{ name:"A312 TP310S", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP310S", uns:"S31008",
      pNo:8, notes:"28,35", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.5,18.2,17.9,17.7,17.4,17.2,16.9,15.9,9.9,7.1,5,3.6,2.5,1.5,0.8,0.5,0.4,0.3,0.2] },
    "A358310S":{ name:"A358 310S", subCat:"SS Pipe", form:"", spec:"A358", grade:"310S", uns:"S31008",
      pNo:8, notes:"28,35,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.5,18.2,17.9,17.7,17.4,17.2,16.9,15.9,9.9,7.1,5,3.6,2.5,1.5,0.8,0.5,0.4,0.3,0.2] },
    "A409TP310S":{ name:"A409 TP310S", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP310S", uns:"S31008",
      pNo:8, notes:"28,31,35,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.5,18.2,17.9,17.7,17.4,17.2,16.9,15.9,9.9,7.1,5,3.6,2.5,1.5,0.8,0.5,0.4,0.3,0.2] },
    "A312TP321_3":{ name:"A312 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A312", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28.0", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A312TP321_4":{ name:"A312 TP321", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A312", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28.0", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A358321":{ name:"A358 321.0", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A358", grade:"321.0", uns:"S32100",
      pNo:8, notes:"28,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A376TP321_3":{ name:"A376 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A376", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A409TP321":{ name:"A409 TP321", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A409", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9,5,3.6,2.6,1.7,1.1,0.8,0.5,0.3] },
    "A312TP309":{ name:"A312 TP309", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP309", uns:"",
      pNo:8, notes:"28,35,39", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.4,18.8,18.5,18.2,18,17.7,17.5,17.2,16.9,13.8,10.3,7.6,5.5,4,3,2.2,1.7,1.3,1,0.8] },
    "A358309S":{ name:"A358 309S", subCat:"SS Pipe", form:"", spec:"A358", grade:"309S", uns:"S30908",
      pNo:8, notes:"28,31,35,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.4,18.8,18.5,18.2,18,17.7,17.5,17.2,16.9,13.8,10.3,7.6,5.5,4,3,2.2,1.7,1.3,1,0.8] },
    "A451CPF8":{ name:"A451 CPF8", subCat:"SS Pipe", form:"", spec:"A451", grade:"CPF8", uns:"J92600",
      pNo:8, notes:"26,28", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,12.2,9.5,7.5,6,4.8,3.9,3.3,2.7,2.3,2,1.7] },
    "A312TP347":{ name:"A312 TP347", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP347", uns:"S34700",
      pNo:8, notes:"", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A358347":{ name:"A358 347.0", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"347.0", uns:"S34700",
      pNo:8, notes:"30,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A376TP347":{ name:"A376 TP347", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP347", uns:"S34700",
      pNo:8, notes:"30,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A409TP347":{ name:"A409 TP347", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP347", uns:"S34700",
      pNo:8, notes:"30,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A312TP348":{ name:"A312 TP348", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP348", uns:"S34800",
      pNo:8, notes:"", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A358348":{ name:"A358 348.0", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"348.0", uns:"S34800",
      pNo:8, notes:"30,36", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A376TP348":{ name:"A376 TP348", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP348", uns:"S34800",
      pNo:8, notes:"30,36", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A409TP348":{ name:"A409 TP348", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP348", uns:"S34800",
      pNo:8, notes:"30,36", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,16,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A451CPH10":{ name:"A451 CPH10", subCat:"SS Pipe", form:"", spec:"A451", grade:"CPH10", uns:"J93402",
      pNo:8, notes:"12,14,28,35,39", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,19.9,19.4,18.9,18.3,17.9,17.5,17,16.5,16,15.4,14.9,11.1,8.5,6.5,5,3.8,2.9,2.3,1.8,1.3,0.9,0.8] },
    "A451CPH20":{ name:"A451 CPH20", subCat:"SS Pipe", form:"", spec:"A451", grade:"CPH20", uns:"J93402",
      pNo:8, notes:"12,14,28,35,39", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,19.9,19.4,18.9,18.3,17.9,17.5,17,16.5,16,15.4,14.9,11.1,8.5,6.5,5,3.8,2.9,2.3,1.8,1.3,0.9,0.8] },
    "A312TP310H":{ name:"A312 TP310H", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP310H", uns:"S31009",
      pNo:8, notes:"29,35,39", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.5,18.2,17.9,17.7,17.4,17.2,16.9,16.7,13.8,10.3,7.6,5.5,4,3,2.2,1.7,1.3,1,0.8] },
    "A451CPF8C":{ name:"A451 CPF8C", subCat:"SS Pipe", form:"", spec:"A451", grade:"CPF8C", uns:"J92710",
      pNo:8, notes:"28.0", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,19.9,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.1,9.1,6.1,4.4,3.3,2.2,1.5,1.2,0.9,0.8] },
    "A312TP321_5":{ name:"A312 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A312", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28,30", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A312TP321_6":{ name:"A312 TP321", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A312", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28,30", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A358321_1":{ name:"A358 321.0", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A358", grade:"321.0", uns:"S32100",
      pNo:8, notes:"28,30,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A376TP321_4":{ name:"A376 TP321", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A376", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28,30,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A409TP321_1":{ name:"A409 TP321", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A409", grade:"TP321", uns:"S32100",
      pNo:8, notes:"28,30,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A312TP321H":{ name:"A312 TP321H", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A312", grade:"TP321H", uns:"S32109",
      pNo:8, notes:"30.0", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A312TP321H_1":{ name:"A312 TP321H", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A312", grade:"TP321H", uns:"S32109",
      pNo:8, notes:"30.0", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A358321H":{ name:"A358 321H", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A358", grade:"321H", uns:"S32109",
      pNo:8, notes:"30,36", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A376TP321H":{ name:"A376 TP321H", subCat:"SS Pipe", form:"SMLS PIPE", spec:"A376", grade:"TP321H", uns:"S32109",
      pNo:8, notes:"30,36", tmin:-325, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,12.3,9.1,6.9,5.4,4.1,3.2,2.5,1.9,1.5,1.1] },
    "A312TP316":{ name:"A312 TP316", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP316", uns:"S31600",
      pNo:8, notes:"26,28", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A358316":{ name:"A358 316.0", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"316.0", uns:"S31600",
      pNo:8, notes:"26,28,31,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A376TP316":{ name:"A376 TP316", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP316", uns:"S31600",
      pNo:8, notes:"26,28,31,36", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A409TP316":{ name:"A409 TP316", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP316", uns:"S31600",
      pNo:8, notes:"26,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A312TP317":{ name:"A312 TP317", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP317", uns:"S31700",
      pNo:8, notes:"26,28", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A409TP317":{ name:"A409 TP317", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP317", uns:"S31700",
      pNo:8, notes:"26,28,31,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A376TP316H":{ name:"A376 TP316H", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP316H", uns:"S31609",
      pNo:8, notes:"26,31,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A312TP316H":{ name:"A312 TP316H", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP316H", uns:"S31609",
      pNo:8, notes:"26.0", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4,9.8,7.4,5.5,4.1,3.1,2.3,1.7,1.3] },
    "A367TP347H":{ name:"A376 TP347H", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP347H", uns:"S34709",
      pNo:8, notes:"30,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A312TP347_1":{ name:"A312 TP347", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP347", uns:"S34700",
      pNo:8, notes:"26.0", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A358347_1":{ name:"A358 347.0", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"347.0", uns:"S34700",
      pNo:8, notes:"28,30,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A376TP347_1":{ name:"A376 TP347", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP347", uns:"S34700",
      pNo:8, notes:"28,30,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A409TP347_1":{ name:"A409 TP347", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP347", uns:"S34700",
      pNo:8, notes:"28,30,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A312TP348_1":{ name:"A312 TP348", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP348", uns:"S34800",
      pNo:8, notes:"28.0", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A358348_1":{ name:"A358 348.0", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"348.0", uns:"S34800",
      pNo:8, notes:"28,30,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A376TP348_1":{ name:"A376 TP348", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP348", uns:"S34800",
      pNo:8, notes:"28,30,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A409TP348_1":{ name:"A409 TP348", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP348", uns:"S34800",
      pNo:8, notes:"28,30,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A312TP347H":{ name:"A312 TP347H", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP347H", uns:"S34709",
      pNo:8, notes:"", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A312TP348H":{ name:"A312 TP348H", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP348H", uns:"S34809",
      pNo:8, notes:"", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1,10.5,7.9,5.9,4.4,3.2,2.5,1.8,1.3] },
    "A312TP304":{ name:"A312 TP304", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP304", uns:"S30400",
      pNo:8, notes:"26,28", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8,7.7,6.1,4.7,3.7,2.9,2.3,1.8,1.4] },
    "A358304":{ name:"A358 304.0", subCat:"SS Pipe", form:"PIPE", spec:"A358", grade:"304.0", uns:"S30400",
      pNo:8, notes:"26,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8,7.7,6.1,4.7,3.7,2.9,2.3,1.8,1.4] },
    "A376TP304":{ name:"A376 TP304", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP304", uns:"S30400",
      pNo:8, notes:"20,26,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8,7.7,6.1,4.7,3.7,2.9,2.3,1.8,1.4] },
    "A376TP304H":{ name:"A376 TP304H", subCat:"SS Pipe", form:"PIPE", spec:"A376", grade:"TP304H", uns:"S30409",
      pNo:8, notes:"26,31,36", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8,7.7,6.1,4.7,3.7,2.9,2.3,1.8,1.4] },
    "A409TP304":{ name:"A409 TP304", subCat:"SS Pipe", form:"PIPE", spec:"A409", grade:"TP304", uns:"S30400",
      pNo:8, notes:"26,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8,7.7,6.1,4.7,3.7,2.9,2.3,1.8,1.4] },
    "A312TP304H":{ name:"A312 TP304H", subCat:"SS Pipe", form:"PIPE", spec:"A312", grade:"TP304H", uns:"S30409",
      pNo:8, notes:"26.0", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8,7.7,6.1,4.7,3.7,2.9,2.3,1.8,1.4] },
    "A451CPF8M":{ name:"A451 CPF8M", subCat:"SS Pipe", form:"PIPE", spec:"A451", grade:"CPF8M", uns:"J92900",
      pNo:8, notes:"26,28", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500],
      sh:[20,20,18.9,17,15.8,15,14.7,14.4,14.2,14.1,13.9,13.7,13.4,13.1,11.5,8.9,6.9,5.4,4.3,3.4,2.8,2.3,1.9,1.6] },
    "A312":{ name:"A312", subCat:"Superaustenitic", form:"PIPE", spec:"A312", grade:"", uns:"N08904",
      pNo:8, notes:"", tmin:-325, smts:71, smys:31, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500],
      sh:[20.7,20.7,20.4,18.7,17.1] },
    "A105350":{ name:"A1053 50.0", subCat:"SS Pipe", form:"WELDED PIPE", spec:"A1053", grade:"50.0", uns:"S41003",
      pNo:7, notes:"", tmin:-20, smts:70, smys:50, eGrp:"SS_Straight", aGrp:"SS_Aust",
      t:[100,200,300,400],
      sh:[23.3,23.3,23.3,22.8] },
    "A451CPE20N":{ name:"A451 CPE20N", subCat:"Duplex Casting", form:"", spec:"A451", grade:"CPE20N", uns:"J92802",
      pNo:8, notes:"35,39", tmin:-325, smts:80, smys:40, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400],
      sh:[26.7,26.7,26.7,26.7] }
,
    "A179":{ name:"A179", subCat:"CS Tube", form:"Tube", spec:"A179", grade:"", uns:"K01200",
      pNo:1, notes:"57,59", tmin:-20, smts:47, smys:26, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[15.7,15.7,15.3,14.8,14.1,13.3,12.8,12.4,10.7,9.2,7.9,5.9,4,2.5,1.6,1] },
    "A105":{ name:"A105", subCat:"CS Forging", form:"Forging", spec:"A105", grade:"", uns:"K03504",
      pNo:1, notes:"9,57,59", tmin:-20, smts:70, smys:36, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,22,21.2,20.5,19.6,18.4,17.8,17.2,14.8,12,9.3,6.7,4,2.5,1.6,1] },
    "A350LF1":{ name:"A350 LF1", subCat:"CS Forging", form:"Forging", spec:"A350", grade:"LF1", uns:"K03009",
      pNo:1, notes:"9,57,59", tmin:-20, smts:60, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[20,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13.8,11.4,8.7,5.9,4,2.5] },
    "A350LF2":{ name:"A350 LF2", subCat:"CS Forging", form:"Forging", spec:"A350", grade:"LF2", uns:"K03011",
      pNo:1, notes:"9,57", tmin:-50, smts:70, smys:36, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[23.3,22,21.2,20.5,19.6,18.4,17.8,17.2,14.8,12,9.3,6.7,4,2.5] },
    "A234WPB":{ name:"A234 WPB", subCat:"CS Fitting", form:"Fitting", spec:"A234", grade:"WPB", uns:"K03006",
      pNo:1, notes:"57,59", tmin:"B", smts:60, smys:35, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.9,19,17.9,17.3,16.7,13.9,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A234WPC":{ name:"A234 WPC", subCat:"CS Fitting", form:"Fitting", spec:"A234", grade:"WPC", uns:"K03501",
      pNo:1, notes:"57,59", tmin:"B", smts:70, smys:40, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800],
      sh:[23.3,23.3,23.3,22.8,21.7,20.4,19.8,18.3,14.8,12] },
    "A216WCA":{ name:"A216 WCA", subCat:"CS Casting", form:"Casting", spec:"A216", grade:"WCA", uns:"J02502",
      pNo:1, notes:"57", tmin:-20, smts:60, smys:30, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,18.3,17.7,17.1,16.3,15.3,14.8,14.3,13.8,11.4,8.7,5.9,4,2.5,1.6,1] },
    "A216WCB":{ name:"A216 WCB", subCat:"CS Casting", form:"Casting", spec:"A216", grade:"WCB", uns:"J03002",
      pNo:1, notes:"9,57", tmin:-20, smts:70, smys:36, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[23.3,22,21.2,20.5,19.6,18.4,17.8,17.2,14.8,12,9.3,6.7,4,2.5,1.6,1] },
    "A216WCC":{ name:"A216 WCC", subCat:"CS Casting", form:"Casting", spec:"A216", grade:"WCC", uns:"J02503",
      pNo:1, notes:"9,57", tmin:-20, smts:70, smys:40, eGrp:"CS", aGrp:"Grp1",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[23.3,23.3,23.3,22.8,21.7,20.4,19.8,18.3,14.8,12,9.3,6.7,4,2.5] },
    "A182F11":{ name:"A182 F11 Cl.1", subCat:"Alloy Forging", form:"Forging", spec:"A182", grade:"F11 Cl.1", uns:"K11597",
      pNo:4, notes:"9", tmin:-20, smts:60, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.5,17.6,16.8,16.2,15.7,15.4,15.1,14.8,14.4,14,13.6,9.3,6.3,4.2,2.8,1.9,1.2] },
    "A182F12":{ name:"A182 F12 Cl.1", subCat:"Alloy Forging", form:"Forging", spec:"A182", grade:"F12 Cl.1", uns:"K11562",
      pNo:4, notes:"9", tmin:-20, smts:60, smys:32, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,19.3,18.1,17.3,16.7,16.3,16,15.8,15.5,15.3,14.9,14.5,11.3,7.2,4.5,2.8,1.8,1.1] },
    "A182F22":{ name:"A182 F22 Cl.1", subCat:"Alloy Forging", form:"Forging", spec:"A182", grade:"F22 Cl.1", uns:"K21590",
      pNo:"5A", notes:"9,72,75", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,17.1,13.6,10.8,8,5.7,3.8,2.4,1.4] },
    "A182F5":{ name:"A182 F5", subCat:"Alloy Forging", form:"Forging", spec:"A182", grade:"F5", uns:"K41545",
      pNo:"5B", notes:"9", tmin:-20, smts:70, smys:40, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[23.3,23.3,22.6,22.4,22.4,22,21.7,21.2,20.6,19.8,14.3,10.9,8,5.8,4.2,2.9,1.8,1] },
    "A182F9":{ name:"A182 F9", subCat:"Alloy Forging", form:"Forging", spec:"A182", grade:"F9", uns:"K90941",
      pNo:"5B", notes:"9", tmin:-20, smts:85, smys:55, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[28.3,28.3,27.4,27.2,27.1,26.8,26.3,25.8,25,24,22.9,15.2,10.6,7.4,5,3.3,2.2,1.5] },
    "A182F91":{ name:"A182 F91", subCat:"Alloy Forging", form:"Forging", spec:"A182", grade:"F91", uns:"K90901",
      pNo:"15E", notes:"", tmin:-20, smts:85, smys:60, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[28.3,28.3,28.3,28.2,28.1,27.7,27.3,26.7,25.9,24.9,23.7,22.3,20.7,18,14,10.3,7,4.3] },
    "A234WP11":{ name:"A234 WP11", subCat:"Alloy Fitting", form:"Fitting", spec:"A234", grade:"WP11 Cl.1", uns:"K11597",
      pNo:4, notes:"", tmin:-20, smts:60, smys:30, eGrp:"CrMo_Cr2Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.5,17.6,16.8,16.2,15.7,15.4,15.1,14.8,14.4,14,13.6,9.3,6.3,4.2,2.8,1.9,1.2] },
    "A234WP22":{ name:"A234 WP22", subCat:"Alloy Fitting", form:"Fitting", spec:"A234", grade:"WP22 Cl.1", uns:"K21590",
      pNo:"5A", notes:"72", tmin:-20, smts:60, smys:30, eGrp:"CrMo_2Cr3Cr", aGrp:"Grp2",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[20,18.7,18.2,18,17.9,17.9,17.9,17.9,17.9,17.7,17.1,13.6,10.8,8,5.7,3.8,2.4,1.4] },
    "A234WP5":{ name:"A234 WP5", subCat:"Alloy Fitting", form:"Fitting", spec:"A234", grade:"WP5", uns:"K41545",
      pNo:"5B", notes:"", tmin:-20, smts:60, smys:30, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_5Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.3,10.9,8,5.8,4.2,2.9] },
    "A234WP9":{ name:"A234 WP9", subCat:"Alloy Fitting", form:"Fitting", spec:"A234", grade:"WP9", uns:"K90941",
      pNo:"5B", notes:"", tmin:-20, smts:60, smys:30, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,18.1,17.4,17.2,17.1,16.8,16.6,16.3,15.9,15.4,14.8,14.1,11,7.4,5,3.3] },
    "A234WP91":{ name:"A234 WP91", subCat:"Alloy Fitting", form:"Fitting", spec:"A234", grade:"WP91", uns:"K90901",
      pNo:"15E", notes:"", tmin:-20, smts:85, smys:60, eGrp:"CrMo_5Cr9Cr", aGrp:"CrMo_9Cr1Mo",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[28.3,28.3,28.3,28.2,28.1,27.7,27.3,26.7,25.9,24.9,23.7,22.3,20.7,18,14,10.3,7,4.3] },
    "A213TP304":{ name:"A213 TP304", subCat:"SS Tube", form:"Tube", spec:"A213", grade:"TP304", uns:"S30400",
      pNo:8, notes:"14,26,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8] },
    "A213TP316":{ name:"A213 TP316", subCat:"SS Tube", form:"Tube", spec:"A213", grade:"TP316", uns:"S31600",
      pNo:8, notes:"14,26,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4] },
    "A213TP321":{ name:"A213 TP321", subCat:"SS Tube", form:"Tube", spec:"A213", grade:"TP321", uns:"S32100",
      pNo:8, notes:"14,28,31,36", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9] },
    "A182F304":{ name:"A182 F304", subCat:"SS Forging", form:"Forging", spec:"A182", grade:"F304", uns:"S30400",
      pNo:8, notes:"9,21,26,28", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8] },
    "A182F316":{ name:"A182 F316", subCat:"SS Forging", form:"Forging", spec:"A182", grade:"F316", uns:"S31600",
      pNo:8, notes:"9,21,26,28", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4] },
    "A182F321":{ name:"A182 F321", subCat:"SS Forging", form:"Forging", spec:"A182", grade:"F321", uns:"S32100",
      pNo:8, notes:"9,21,28", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9] },
    "A182F347":{ name:"A182 F347", subCat:"SS Forging", form:"Forging", spec:"A182", grade:"F347", uns:"S34700",
      pNo:8, notes:"9,21", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1] },
    "A403WP304":{ name:"A403 WP304", subCat:"SS Fitting", form:"Fitting", spec:"A403", grade:"WP304", uns:"S30400",
      pNo:8, notes:"26,28,32,37", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8] },
    "A403WP316":{ name:"A403 WP316", subCat:"SS Fitting", form:"Fitting", spec:"A403", grade:"WP316", uns:"S31600",
      pNo:8, notes:"26,28,32,37", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.3,18,17,16.6,16.3,16.1,15.9,15.7,15.6,15.4,15.3,15.1,12.4] },
    "A403WP321":{ name:"A403 WP321", subCat:"SS Fitting", form:"Fitting", spec:"A403", grade:"WP321", uns:"S32100",
      pNo:8, notes:"28,32,37", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,20,19.3,18.3,17.8,17.5,17.2,16.9,16.7,16.5,16.4,16.2,9.6,6.9] },
    "A403WP347":{ name:"A403 WP347", subCat:"SS Fitting", form:"Fitting", spec:"A403", grade:"WP347", uns:"S34700",
      pNo:8, notes:"28,32,37", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,20,20,19.3,19,18.7,18.5,18.3,18.2,18.1,18.1,18.1,17.4,14.1] },
    "A351CF8":{ name:"A351 CF8", subCat:"SS Casting", form:"Casting", spec:"A351", grade:"CF8", uns:"J92600",
      pNo:8, notes:"9,26,27,31", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,12.2] },
    "A351CF8M":{ name:"A351 CF8M", subCat:"SS Casting", form:"Casting", spec:"A351", grade:"CF8M", uns:"J92900",
      pNo:8, notes:"9,26,27,30", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000],
      sh:[20,20,18.9,17,15.8,15,14.7,14.4,14.2,14.1,13.9,13.7,13.4,13.1] },
    "A351CF3":{ name:"A351 CF3", subCat:"SS Casting", form:"Casting", spec:"A351", grade:"CF3", uns:"J92500",
      pNo:8, notes:"9", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2] },
    "A351CF3M":{ name:"A351 CF3M", subCat:"SS Casting", form:"Casting", spec:"A351", grade:"CF3M", uns:"J92800",
      pNo:8, notes:"9", tmin:-425, smts:70, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850],
      sh:[20,20,20,19.2,17.9,17,16.6,16.3,16,15.8,15.7] },
    "A479_304":{ name:"A479 304", subCat:"SS Bar", form:"Bar", spec:"A479", grade:"304", uns:"S30400",
      pNo:8, notes:"26,28", tmin:-425, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,18.6,17.5,16.6,16.2,15.8,15.5,15.2,14.9,14.6,14.3,14,12.4,9.8] },
    "A479_316":{ name:"A479 316", subCat:"SS Bar", form:"Bar", spec:"A479", grade:"316", uns:"S31600",
      pNo:8, notes:"26,28", tmin:-325, smts:75, smys:30, eGrp:"SS_Aust", aGrp:"SS_Aust",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,19.3,17.9,17,16.7,16.3,16.1,15.9,15.7,15.5,15.4,15.3,14.5,12.4] },
    "A790_2205":{ name:"A790 2205 (Duplex)", subCat:"Duplex 22Cr", form:"Smls. & Wld. Pipe", spec:"A790", grade:"2205", uns:"S32205",
      pNo:"10H", notes:"25", tmin:-60, smts:95, smys:70, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[31.7,31.7,30.6,29.4,28.7,28.4] },
    "A789_2205":{ name:"A789 2205 (Duplex)", subCat:"Duplex 22Cr", form:"Smls. & Wld. Tube", spec:"A789", grade:"2205", uns:"S32205",
      pNo:"10H", notes:"25", tmin:-60, smts:95, smys:70, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[31.7,31.7,30.6,29.4,28.7,28.4] },
    "A182F60":{ name:"A182 F60 (Duplex 2205)", subCat:"Duplex 22Cr", form:"Forging", spec:"A182", grade:"F60", uns:"S32205",
      pNo:"10H", notes:"25", tmin:-60, smts:95, smys:65, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[31.7,31.7,30.6,29.4,28.7,28.4] },
    "A240_2205":{ name:"A240 2205 (Duplex)", subCat:"Duplex 22Cr", form:"Plate", spec:"A240", grade:"2205", uns:"S32205",
      pNo:"10H", notes:"25", tmin:-60, smts:95, smys:65, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[31.7,31.7,30.6,29.4,28.7,28.4] },
    "A815_2205":{ name:"A815 WPS32205", subCat:"Duplex 22Cr", form:"Fitting", spec:"A815", grade:"WPS32205", uns:"S32205",
      pNo:"10H", notes:"25", tmin:-60, smts:95, smys:65, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[31.7,31.7,30.6,29.4,28.7,28.4] },
    "A790_31803":{ name:"A790 S31803 (Duplex)", subCat:"Duplex 22Cr", form:"Smls. & Wld. Pipe", spec:"A790", grade:"", uns:"S31803",
      pNo:"10H", notes:"25", tmin:-60, smts:90, smys:65, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[30,30,28.9,27.8,27.2,26.9] },
    "A182F51":{ name:"A182 F51 (Duplex S31803)", subCat:"Duplex 22Cr", form:"Forging", spec:"A182", grade:"F51", uns:"S31803",
      pNo:"10H", notes:"25", tmin:-60, smts:90, smys:65, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[30,30,28.9,27.8,27.2,26.9] },
    "A790_2507":{ name:"A790 2507 (Super Duplex)", subCat:"Super Duplex 25Cr", form:"Smls. & Wld. Pipe", spec:"A790", grade:"2507", uns:"S32750",
      pNo:"10H", notes:"25", tmin:-60, smts:116, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[38.7,38.5,36.4,35.1,34.5,34.3] },
    "A789_2507":{ name:"A789 2507 (Super Duplex)", subCat:"Super Duplex 25Cr", form:"Smls. & Wld. Tube", spec:"A789", grade:"2507", uns:"S32750",
      pNo:"10H", notes:"25", tmin:-60, smts:116, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[38.7,38.5,36.4,35.1,34.5,34.3] },
    "A182F53":{ name:"A182 F53 (Super Duplex 2507)", subCat:"Super Duplex 25Cr", form:"Forging", spec:"A182", grade:"F53", uns:"S32750",
      pNo:"10H", notes:"25", tmin:-60, smts:116, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[38.7,38.5,36.4,35.1,34.5,34.3] },
    "A240_2507":{ name:"A240 2507 (Super Duplex)", subCat:"Super Duplex 25Cr", form:"Plate", spec:"A240", grade:"2507", uns:"S32750",
      pNo:"10H", notes:"25", tmin:-60, smts:116, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[38.7,38.5,36.4,35.1,34.5,34.3] },
    "A815_2507":{ name:"A815 WPS32750", subCat:"Super Duplex 25Cr", form:"Fitting", spec:"A815", grade:"WPS32750", uns:"S32750",
      pNo:"10H", notes:"25", tmin:-60, smts:116, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[38.7,38.5,36.4,35.1,34.5,34.3] },
    "A790_32760":{ name:"A790 S32760 (Zeron 100)", subCat:"Super Duplex 25Cr", form:"Smls. & Wld. Pipe", spec:"A790", grade:"", uns:"S32760",
      pNo:"10H", notes:"25", tmin:-60, smts:109, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[36.3,35.9,34.4,34,34,34] },
    "A182F55":{ name:"A182 F55 (S32760)", subCat:"Super Duplex 25Cr", form:"Forging", spec:"A182", grade:"F55", uns:"S32760",
      pNo:"10H", notes:"25", tmin:-60, smts:109, smys:80, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[36.3,36.3,34.8,34,33.9,33.9] },
    "A790_2304":{ name:"A790 2304 (Lean Duplex)", subCat:"Lean Duplex", form:"Smls. & Wld. Pipe", spec:"A790", grade:"2304", uns:"S32304",
      pNo:"10H", notes:"25", tmin:-60, smts:87, smys:58, eGrp:"SS_Straight", aGrp:"SS_Straight",
      t:[100,200,300,400,500,600],
      sh:[29,27.9,26.1,24.7,22.9,19.2] },
    "B165":{ name:"B165 Monel N04400", subCat:"Ni Alloy Pipe", form:"Pipe", spec:"B165", grade:"", uns:"N04400",
      pNo:42, notes:"", tmin:-325, smts:70, smys:28, eGrp:"Ni_N04400", aGrp:"Ni_Monel",
      t:[100,200,300,400,500,600,650,700,750,800,850,900],
      sh:[18.7,16.4,15.2,14.7,14.7,14.7,14.7,14.6,14.5,14.3,11,8] },
    "B167_600":{ name:"B167 Inconel 600", subCat:"Ni Alloy Pipe", form:"Pipe", spec:"B167", grade:"N06600", uns:"N06600",
      pNo:43, notes:"", tmin:-325, smts:80, smys:35, eGrp:"Ni_N06002", aGrp:"Ni_N06600",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150],
      sh:[23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,23.3,16,10.6,7,4.5,3,2.2,2] },
    "B407_800":{ name:"B407 Incoloy 800", subCat:"Ni Alloy Pipe", form:"Pipe", spec:"B407", grade:"N08800", uns:"N08800",
      pNo:45, notes:"61", tmin:-325, smts:75, smys:30, eGrp:"Ni_N08800", aGrp:"Ni_N08800",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100],
      sh:[20,20,20,20,20,20,20,20,20,20,20,20,19.9,17,13,9.8] },
    "B564_625":{ name:"B564 Inconel 625", subCat:"Ni Alloy Forging", form:"Forging", spec:"B564", grade:"N06625", uns:"N06625",
      pNo:43, notes:"9,64", tmin:-325, smts:120, smys:60, eGrp:"Ni_N06625", aGrp:"Ni_N06625",
      t:[100,200,300,400,500,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200],
      sh:[40,40,39.6,39.2,38.6,37.8,37.4,37,36.6,36.3,36.1,35.8,35.4,31.2,31.2,23.1,21,13.2] },
  };

  /* ---- TABLE C-6: Moduli of Elasticity, ×10⁶ psi ---- */
  const E_GROUPS = {
    CS:{ desc:"Carbon steels, C ≤ 0.30%",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200],
      e:[31.9,31.4,30.8,30.3,29.4,28.8,28.3,27.4,27.3,26.5,25.5,24.2,22.5,20.4,18.0] },
    CS_hi:{ desc:"Carbon steels, C > 0.30%",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200],
      e:[31.7,31.2,30.6,30.1,29.2,28.6,28.1,27.7,27.1,26.4,25.3,24.0,22.3,20.2,17.9,15.4] },
    CrMo:{ desc:"Carbon-molybdenum steels",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200],
      e:[31.7,31.1,30.5,30.0,29.0,28.5,28.0,27.6,27.0,26.3,25.3,23.9,22.2,20.1,17.8,15.3] },
    Ni2_9:{ desc:"Nickel steels, Ni 2% to 9%",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      e:[30.1,29.6,29.0,28.6,27.8,27.1,26.7,26.2,25.7,25.1,24.6,23.9,23.2,22.4,21.5,20.4,19.2,17.7] },
    CrMo_Cr2Cr:{ desc:"Chromium steels, 1/2Cr through 2Cr",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300],
      e:[32.1,31.6,30.9,30.5,29.6,29.0,28.5,28.0,27.4,26.9,26.2,25.6,24.8,23.9,23.0,21.8,20.5,18.9] },
    CrMo_2Cr3Cr:{ desc:"Chromium steels, 2-1/4Cr through 3Cr",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300],
      e:[33.1,32.6,31.9,31.4,30.6,29.9,29.4,28.8,28.3,27.7,27.0,26.3,25.6,24.7,23.7,22.5,21.1,19.4] },
    CrMo_5Cr9Cr:{ desc:"Chromium steels, 5Cr through 9Cr",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300],
      e:[33.4,33.0,32.4,31.9,31.0,30.3,29.7,29.2,28.6,28.1,27.5,26.9,26.2,25.4,24.4,23.3,22.0,20.5] },
    SS_Aust:{ desc:"Austenitic stainless steels (304, 316, 321, 347, etc.)",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500],
      e:[30.8,30.3,29.7,29.2,28.3,27.5,27.0,26.4,25.9,25.3,24.8,24.1,23.5,22.8,22.0,21.2,20.3,19.2,18.1] },
    SS_Straight:{ desc:"Straight chromium stainless steels (12Cr, 17Cr, 27Cr, Duplex)",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200],
      e:[31.8,31.2,30.7,30.2,29.2,28.4,27.9,27.3,26.8,26.2,25.5,24.5,23.2,21.5,19.2,16.5] },
    Ni_N04400:{ desc:"Monel (N04400)",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      e:[28.3,27.8,27.2,26.8,26.0,25.5,25.1,24.7,24.3,23.9,23.6,23.1,22.7,22.2,21.7,21.2,20.6,20.0,19.4] },
    Ni_N06002:{ desc:"Nickel alloy N06002/N06600 group",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500],
      e:[31.1,30.5,29.9,29.3,28.5,27.9,27.5,27.1,26.7,26.2,25.8,25.4,24.9,24.3,23.8,23.2,22.5,21.9,21.2] },
    Ni_N06625:{ desc:"Inconel 625 (N06625)",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500],
      e:[32.7,32.2,31.4,30.9,30.0,29.4,28.9,28.5,28.1,27.6,27.2,26.7,26.2,25.7,25.1,24.5,23.7,23.0,22.3] },
    Ni_N08800:{ desc:"Incoloy 800 (N08800/N08810)",
      t:[-425,-325,-200,-100,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500],
      e:[31.1,30.5,29.9,29.3,28.5,27.9,27.5,27.1,26.7,26.2,25.8,25.4,24.9,24.4,23.8,23.2,22.6,21.9,21.2] }
  };

  /* ---- TABLE C-1: Mean Coefficient of Thermal Expansion, ×10⁻⁶ in./in./°F
         (mean from 70°F to indicated temperature) ---- */
  const A_GROUPS = {
    Grp1:{ desc:"Group 1 carbon and low alloy steels",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.5,5.9,6.2,6.4,6.7,6.9,7.1,7.3,7.4,7.6,7.8,7.9,8.1,8.2,8.3,8.4,8.4] },
    Grp2:{ desc:"Group 2 low alloy steels (Cr-Mo)",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[6.0,6.5,6.7,7.0,7.3,7.4,7.6,7.7,7.8,7.9,8.0,8.1,8.2,8.3,8.4,8.4,8.5] },
    CrMo_5Cr1Mo:{ desc:"5Cr-1Mo steels",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.6,6.0,6.2,6.4,6.7,6.9,7.0,7.1,7.2,7.2,7.3,7.4,7.5,7.6,7.6,7.7,7.8] },
    CrMo_9Cr1Mo:{ desc:"9Cr-1Mo steels",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.0,5.4,5.6,5.8,6.0,6.2,6.3,6.4,6.5,6.6,6.7,6.8,6.9,7.0,7.1,7.2,7.2] },
    SS_Aust:{ desc:"Austenitic stainless steels (304, 316, 317, 321, 347, 348)",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[7.5,8.0,8.2,8.5,8.9,9.2,9.5,9.7,9.9,10.0,10.1,10.2,10.3,10.4,10.6,10.7,10.8] },
    SS_Straight:{ desc:"Straight chromium stainless / duplex (12Cr-27Cr)",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.1,5.5,5.7,5.9,6.2,6.3,6.4,6.5,6.5,6.6,6.7,6.7,6.8,6.8,6.9,6.9,7.0] },
    Ni_Monel:{ desc:"Monel (67Ni-30Cu) N04400",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.8,6.8,7.2,7.7,8.1,8.3,8.5,8.7,8.8,8.9,8.9,9.0,9.1,9.1,9.2,9.2,9.3] },
    Ni_N06600:{ desc:"Nickel alloy N06600 (Inconel 600)",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.5,6.1,6.4,6.8,7.1,7.3,7.5,7.6,7.8,7.9,8.0,8.2,8.3,8.4,8.6,8.7,8.9] },
    Ni_N06625:{ desc:"Nickel alloy N06625 (Inconel 625)",
      t:[70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[6.7,7.1,7.2,7.3,7.4,7.5,7.6,7.7,7.7,7.9,8.0,8.2,8.4,8.5] },
    Ni_N08800:{ desc:"Nickel alloy N08800/N08810 (Incoloy 800)",
      t:[-325,-150,-50,70,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400],
      a:[5.9,6.9,7.4,7.9,8.4,8.6,8.8,8.9,9.0,9.1,9.2,9.3,9.4,9.5,9.6,9.7,9.8] }
  };

  /* ---- TABLE A-1B: Basic Quality Factors Ej ---- */
  const EJ = {
    seamless: 1.00,
    erw: 0.85,
    efw_100rt: 1.00,  // Electric fusion welded, 100% radiographed
    efw_spot: 0.90,   // Electric fusion welded, spot radiographed
    efw_dbl: 0.85,    // Electric fusion welded, double butt seam
    efw_sgl: 0.80,    // Electric fusion welded, single butt seam
    furnace: 0.60,    // Continuous welded (furnace butt welded)
    /* Per-spec lookups */
    bySpec: {
      A53:  { S:1.00, E:0.85, F:0.60 },
      A106: { seamless:1.00 },
      A134: { efw:0.80 },
      A135: { erw:0.85 },
      A139: { efw:0.80 },
      A179: { seamless:1.00 },
      A312: { seamless:1.00, efw_100rt:1.00, efw_dbl:0.85, efw_sgl:0.80 },
      A333: { seamless:1.00, erw:0.85 },
      A335: { seamless:1.00 },
      A358: { cls134:1.00, cls5:0.90, cls2:0.85 },
      A369: { seamless:1.00 },
      A376: { seamless:1.00 },
      A381: { efw_100rt:1.00, efw_spot:0.90, efw_mfg:0.85 },
      A409: { efw_dbl:0.85, efw_sgl:0.80 },
      A524: { seamless:1.00 },
      A587: { erw:0.85 },
      A671: { cls12_100rt:1.00, cls13_dbl:0.85 },
      A672: { cls12_100rt:1.00, cls13_dbl:0.85 },
      A691: { cls12_100rt:1.00, cls13_dbl:0.85 },
      A789: { seamless:1.00, efw_100rt:1.00, efw_dbl:0.85, efw_sgl:0.80 },
      A790: { seamless:1.00, efw_100rt:1.00, efw_dbl:0.85, efw_sgl:0.80 },
      A928: { cls134:1.00, cls5:0.90, cls2:0.85 },
      API5L:{ seamless:1.00, efw_100rt:1.00, erw:0.85, efw_dbl:0.95, furnace:0.60 }
    }
  };

  /* ---- TABLE A-1A: Basic Casting Quality Factors Ec ---- */
  const EC = {
    A216: 0.80, A217: 0.80, A351: 0.80, A352: 0.80,
    A426: 1.00, A451: 0.90, A487: 0.80, A995: 0.80,
    A494: 0.80
  };

  /* ---- Density, g/cm³ (handbook values, code-agnostic) ---- */
  const RHO = {
    CS:7.85, Alloy:7.85, SS_Aust:8.00, SS_Duplex:7.80,
    Ni_Monel:8.83, Ni_Inconel600:8.47, Ni_Inconel625:8.44, Ni_Incoloy800:7.94
  };

  /* ---- SUPPLEMENTARY: welding characteristics (NOT a code requirement
     lookup — indicative practice notes only; always confirm against the
     project WPS/PQR and the governing code edition before use). ----
     level: Low | Moderate | Moderate-High | High — relative shop/field
            difficulty and procedure-control burden, not a numeric ratio.
     preheat: typical minimum preheat guidance (text, since it's often a
              thickness-dependent range rather than a single number).
     pwht: typical PWHT expectation for this grade.
     process: commonly used process combination.
     notes: the one pitfall worth knowing before you spec a dissimilar or
            unfamiliar-grade weld. */
  const WELD = {
    A106B:{ level:"Low",
      preheat:"Not normally required below ~25 mm; check WPS for thicker sections",
      pwht:"Required above code thickness/temperature threshold (B31.3 Table 331.1.1)",
      process:"GTAW root + SMAW fill (ER70S-2 / E7018)",
      notes:"Standard carbon-steel practice; the most forgiving grade in this list." },
    "A333-6":{ level:"Moderate",
      preheat:"Light preheat typical, thickness dependent",
      pwht:"Usually required — needed to restore/verify low-temperature CVN toughness",
      process:"GTAW root + SMAW fill, low-hydrogen consumables",
      notes:"Heat input must stay controlled or the low-temperature impact toughness the grade is chosen for gets eroded." },
    TP304:{ level:"Moderate",
      preheat:"None required",
      pwht:"Not normally required — avoid unless a specific case requires it",
      process:"GTAW root + GTAW/SMAW fill, matching filler",
      notes:"Control interpass temperature; avoid prolonged dwell in the ~425–870°C sensitization range (carbide precipitation, reduced corrosion resistance)." },
    TP316L:{ level:"Moderate",
      preheat:"None required",
      pwht:"Not normally required",
      process:"GTAW root + GTAW/SMAW fill, low-carbon matching filler",
      notes:"Lower carbon than 304 reduces sensitization risk, but interpass temperature control is still good practice." },
    DUP2205:{ level:"High",
      preheat:"None to slight; keep interpass temperature capped (~100°C typical limit)",
      pwht:"Not normally required if the procedure is properly controlled",
      process:"GTAW with matched high-nickel filler (e.g. ER2209)",
      notes:"Narrow heat-input window — overheating shifts the ferrite/austenite balance and risks sigma-phase formation, degrading both toughness and the corrosion resistance the grade was selected for. Needs a qualified WPS and experienced welders." },
    P11:{ level:"Moderate-High",
      preheat:"150–200°C minimum, maintained between passes",
      pwht:"Required per code",
      process:"GTAW root + SMAW fill, low-hydrogen consumables",
      notes:"Hydrogen cracking risk if preheat lapses between passes." },
    P22:{ level:"High",
      preheat:"200–260°C minimum, maintained between passes",
      pwht:"Required (mandatory)",
      process:"GTAW root + SMAW fill, low-hydrogen consumables",
      notes:"Higher hardenability than P11 increases hydrogen-cracking risk; needs strict interpass control and PWHT — budget more inspection time." }
  };
  const WELD_LEVEL_RANK = { "Low":1, "Moderate":2, "Moderate-High":3, "High":4 };


  /* ==================================================================
     ASTM / API / CSA SPECIFICATION FULL NAMES
     ------------------------------------------------------------------
     Per ASME B31.3 – 2020 Edition, Appendix A referenced specs.
     Covers product forms commonly used in Oil & Gas piping: seamless &
     welded pipe, fittings, flanges/forgings, plate, bar, bolting,
     castings, and line pipe. Expand as materials are added.
     ================================================================== */
  const ASTM_SPECS = {
    /* --- Carbon & Alloy Steel — Pipe --- */
    A53:   "Pipe, Steel, Black and Hot-Dipped, Zinc-Coated, Welded and Seamless",
    A106:  "Seamless Carbon Steel Pipe for High-Temperature Service",
    A134:  "Pipe, Steel, Electric-Fusion (Arc)-Welded (Sizes NPS 16 and Over)",
    A135:  "Electric-Resistance-Welded Steel Pipe",
    A139:  "Electric-Fusion (Arc)-Welded Steel Pipe (NPS 4 and Over)",
    A333:  "Seamless and Welded Steel Pipe for Low-Temperature Service and Other Applications with Required Notch Toughness",
    A335:  "Seamless Ferritic Alloy-Steel Pipe for High-Temperature Service",
    A369:  "Carbon and Ferritic Alloy Steel Forged and Bored Pipe for High-Temperature Service",
    A381:  "Metal-Arc-Welded Carbon or High-Strength Low-Alloy Steel Pipe for Use With High-Pressure Transmission Systems",
    A524:  "Seamless Carbon Steel Pipe for Atmospheric and Lower Temperatures",
    A587:  "Electric-Resistance-Welded Low-Carbon Steel Pipe for the Chemical Industry",
    A671:  "Electric-Fusion-Welded Steel Pipe for Atmospheric and Lower Temperatures",
    A672:  "Electric-Fusion-Welded Steel Pipe for High-Pressure Service at Moderate Temperatures",
    A691:  "Carbon and Alloy Steel Pipe, Electric-Fusion-Welded for High-Pressure Service at High Temperatures",

    /* --- Carbon & Alloy Steel — Fittings --- */
    A234:  "Piping Fittings of Wrought Carbon Steel and Alloy Steel for Moderate and High Temperature Service",
    A420:  "Piping Fittings of Wrought Carbon Steel and Alloy Steel for Low-Temperature Service",
    A860:  "Wrought High-Strength Ferritic Steel Butt-Welding Fittings",

    /* --- Carbon & Alloy Steel — Forgings (flanges, valves) --- */
    A105:  "Carbon Steel Forgings for Piping Applications",
    A181:  "Carbon Steel Forgings, for General-Purpose Piping",
    A182:  "Forged or Rolled Alloy and Stainless Steel Pipe Flanges, Forged Fittings, and Valves and Parts for High-Temperature Service",
    A350:  "Carbon and Low-Alloy Steel Forgings, Requiring Notch Toughness Testing for Piping Components",
    A694:  "Carbon and Alloy Steel Forgings for Pipe Flanges, Fittings, Valves, and Parts for High-Pressure Transmission Service",
    A707:  "Forged Carbon and Alloy Steel Flanges for Low-Temperature Service",

    /* --- Carbon & Alloy Steel — Plate --- */
    A36:   "Carbon Structural Steel",
    A283:  "Low and Intermediate Tensile Strength Carbon Steel Plates",
    A285:  "Pressure Vessel Plates, Carbon Steel, Low- and Intermediate-Tensile Strength",
    A299:  "Pressure Vessel Plates, Carbon Steel, Manganese-Silicon",
    A387:  "Pressure Vessel Plates, Alloy Steel, Chromium-Molybdenum",
    A515:  "Pressure Vessel Plates, Carbon Steel, for Intermediate- and Higher-Temperature Service",
    A516:  "Pressure Vessel Plates, Carbon Steel, for Moderate and Lower-Temperature Service",
    A537:  "Pressure Vessel Plates, Heat-Treated, Carbon-Manganese-Silicon Steel",

    /* --- Carbon & Alloy Steel — Tubes --- */
    A179:  "Seamless Cold-Drawn Low-Carbon Steel Heat-Exchanger and Condenser Tubes",
    A213:  "Seamless Ferritic and Austenitic Alloy-Steel Boiler, Superheater, and Heat-Exchanger Tubes",
    A334:  "Seamless and Welded Carbon and Alloy-Steel Tubes for Low-Temperature Service",

    /* --- Bolting --- */
    A193:  "Alloy-Steel and Stainless Steel Bolting for High Temperature or High Pressure Service and Other Special Purpose Applications",
    A194:  "Carbon Steel, Alloy Steel, and Stainless Steel Nuts for Bolts for High Pressure or High Temperature Service, or Both",
    A307:  "Carbon Steel Bolts and Studs, 60 000 PSI Tensile Strength",
    A320:  "Alloy-Steel and Stainless Steel Bolting for Low-Temperature Service",
    A354:  "Quenched and Tempered Alloy Steel Bolts, Studs, and Other Externally Threaded Fasteners",
    A563:  "Carbon and Alloy Steel Nuts",

    /* --- Castings --- */
    A216:  "Steel Castings, Carbon, Suitable for Fusion Welding, for High-Temperature Service",
    A217:  "Steel Castings, Martensitic Stainless and Alloy, for Pressure-Containing Parts, Suitable for High-Temperature Service",
    A351:  "Castings, Austenitic, for Pressure-Containing Parts",
    A352:  "Steel Castings, Ferritic and Martensitic, for Pressure-Containing Parts, Suitable for Low-Temperature Service",

    /* --- Stainless Steel — Pipe --- */
    A312:  "Seamless, Welded, and Heavily Cold Worked Austenitic Stainless Steel Pipes",
    A358:  "Electric-Fusion-Welded Austenitic Chromium-Nickel Stainless Steel Pipe for High-Temperature Service and General Applications",
    A376:  "Seamless Austenitic Steel Pipe for High-Temperature Service",
    A409:  "Welded Large Diameter Austenitic Steel Pipe for Corrosive or High-Temperature Service",
    A790:  "Seamless and Welded Ferritic/Austenitic Stainless Steel Pipe",
    A813:  "Single- or Double-Welded Austenitic Stainless Steel Pipe",
    A928:  "Ferritic/Austenitic (Duplex) Stainless Steel Pipe Electric Fusion Welded with Addition of Filler Metal",

    /* --- Stainless Steel — Fittings --- */
    A403:  "Wrought Austenitic Stainless Steel Piping Fittings",
    A815:  "Wrought Ferritic, Ferritic/Austenitic, and Martensitic Stainless Steel Piping Fittings",

    /* --- Stainless Steel — Plate, Bar, Tube --- */
    A240:  "Chromium and Chromium-Nickel Stainless Steel Plate, Sheet, and Strip for Pressure Vessels and for General Applications",
    A268:  "Seamless and Welded Ferritic and Martensitic Stainless Steel Tubing for General Service",
    A269:  "Seamless and Welded Austenitic Stainless Steel Tubing for General Service",
    A276:  "Stainless Steel Bars and Shapes",
    A479:  "Stainless Steel Bars and Shapes for Use in Boilers and Other Pressure Vessels",
    A789:  "Seamless and Welded Ferritic/Austenitic Stainless Steel Tubing for General Service",

    /* --- Stainless Steel — Castings --- */
    A995:  "Castings, Austenitic-Ferritic (Duplex) Stainless Steel, for Pressure-Containing Parts",

    /* --- Nickel Alloy — Pipe & Tube --- */
    B161:  "Nickel Seamless Pipe and Tube",
    B165:  "Nickel-Copper Alloy (UNS N04400) Seamless Pipe and Tube",
    B167:  "Nickel-Chromium-Iron Alloys and Nickel-Chromium-Cobalt-Molybdenum Alloy Seamless Pipe and Tube",
    B407:  "Nickel-Iron-Chromium Alloy Seamless Pipe and Tube",
    B423:  "Nickel-Iron-Chromium-Molybdenum-Copper Alloy (UNS N08825, N08221, N06845) Seamless Pipe and Tube",
    B444:  "Nickel-Chromium-Molybdenum-Columbium Alloys (UNS N06625, N06852) and Nickel-Chromium-Molybdenum-Silicon Alloy (UNS N06219) Pipe and Tube",
    B668:  "UNS N08028 Seamless Pipe and Tube",
    B690:  "Iron-Nickel-Chromium-Molybdenum Alloy (UNS N08367) Seamless Pipe and Tube",
    B725:  "Welded Nickel (UNS N02200/N02201) and Nickel Copper Alloy (UNS N04400) Pipe",
    B474:  "Electric Fusion Welded Nickel and Nickel Alloy Pipe",
    B514:  "Welded Nickel-Iron-Chromium Alloy Pipe",
    B705:  "Nickel-Alloy (UNS N06625, N06219 and N08825) Welded Pipe",

    /* --- Nickel Alloy — Plate, Bar, Fittings, Forgings --- */
    B127:  "Nickel-Copper Alloy (UNS N04400) Plate, Sheet, and Strip",
    B160:  "Nickel Rod and Bar",
    B162:  "Nickel Plate, Sheet and Strip",
    B164:  "Nickel-Copper Alloy Rod, Bar, and Wire",
    B168:  "Nickel-Chromium-Iron Alloys and Nickel-Chromium-Cobalt-Molybdenum Alloy Plate, Sheet and Strip",
    B366:  "Factory-Made Wrought Nickel and Nickel Alloy Fittings",
    B409:  "Nickel-Iron-Chromium Alloy Plate, Sheet, and Strip",
    B424:  "Ni-Fe-Cr-Mo-Cu Alloy (UNS N08825, N08221, N06845) Plate, Sheet, and Strip",
    B443:  "Nickel-Chromium-Molybdenum-Columbium Alloy (UNS N06625) and Nickel-Chromium-Molybdenum-Silicon Alloy (UNS N06219) Plate, Sheet, and Strip",
    B462:  "Forged or Rolled Nickel Alloy Pipe Flanges, Forged Fittings, and Valves and Parts for Corrosive High-Temperature Service",
    B564:  "Nickel Alloy Forgings",
    B574:  "Low-Carbon Nickel-Chromium-Molybdenum and Related Alloy Rod",
    B575:  "Low-Carbon Nickel-Chromium-Molybdenum and Related Alloy Plate, Sheet and Strip",

    /* --- Copper Alloy (limited O&G use, included for completeness) --- */
    B42:   "Seamless Copper Pipe, Standard Sizes",
    B75:   "Seamless Copper Tube",
    B466:  "Seamless Copper-Nickel Pipe and Tube",
    B467:  "Welded Copper-Nickel Pipe",
    B43:   "Seamless Red Brass Pipe, Standard Sizes",
    B68:   "Seamless Copper Tube, Bright Annealed",
    B88:   "Seamless Copper Water Tube",
    B96:   "Copper-Silicon Alloy Plate, Sheet, Strip, and Rolled Bar for General Purposes and Pressure Vessels",
    B98:   "Copper-Silicon Alloy Rod, Bar and Shapes",
    B148:  "Aluminum-Bronze Sand Castings",
    B150:  "Aluminum Bronze Rod, Bar and Shapes",
    B152:  "Copper Sheet, Strip, Plate and Rolled Bar",
    B169:  "Aluminum Bronze Sheet, Strip, and Rolled Bar",
    B171:  "Copper-Alloy Plate and Sheet for Pressure Vessels, Condensers, and Heat Exchangers",
    B187:  "Copper, Bus Bar, Rod, and Shapes and General Purpose Rod, Bar, and Shapes",
    B280:  "Seamless Copper Tube for Air Conditioning and Refrigeration Field Service",
    B283:  "Copper and Copper-Alloy Die Forgings (Hot-Pressed)",
    B371:  "Copper-Zinc-Silicon Alloy Rod",

    /* --- Titanium --- */
    B265:  "Titanium and Titanium Alloy Strip, Sheet, and Plate",
    B348:  "Titanium and Titanium Alloy Bars and Billets",
    B363:  "Seamless and Welded Unalloyed Titanium and Titanium Alloy Welding Fittings",
    B367:  "Titanium and Titanium Alloy Castings",
    B381:  "Titanium and Titanium Alloy Forgings",
    B861:  "Titanium and Titanium Alloy Seamless Pipe",
    B862:  "Titanium and Titanium Alloy Welded Pipe",

    /* --- Zirconium --- */
    B493:  "Zirconium and Zirconium Alloy Forgings",
    B523:  "Seamless and Welded Zirconium and Zirconium Alloy Tubes",
    B550:  "Zirconium and Zirconium Alloy Bar and Wire",
    B551:  "Zirconium and Zirconium Alloy Strip, Sheet, and Plate",

    /* --- Aluminium --- */
    B26:   "Aluminum-Alloy Sand Castings",
    B209:  "Aluminum and Aluminum-Alloy Sheet and Plate",
    B210:  "Aluminum and Aluminum-Alloy Drawn Seamless Tubes",
    B211:  "Aluminum and Aluminum-Alloy Rolled or Cold Finished Bar, Rod, and Wire",
    B221:  "Aluminum and Aluminum-Alloy Extruded Bars, Rods, Wire, Profiles, and Tubes",
    B241:  "Aluminum and Aluminum-Alloy Seamless Pipe and Seamless Extruded Tube",
    B247:  "Aluminum and Aluminum-Alloy Die Forgings, Hand Forgings, and Rolled Ring Forgings",
    B345:  "Aluminum and Aluminum-Alloy Seamless Pipe and Seamless Extruded Tube for Gas and Oil Transmission and Distribution Piping Systems",
    B361:  "Factory-Made Wrought Aluminum and Aluminum-Alloy Welding Fittings",
    B491:  "Aluminum and Aluminum-Alloy Extruded Round Tubes for General-Purpose Applications",

    /* --- Additional Nickel Alloy specs --- */
    B163:  "Seamless Nickel and Nickel Alloy Condenser and Heat Exchanger Tubes",
    B166:  "Nickel-Chromium-Iron Alloys, Ni-Cr-Co-Mo Alloy, Ni-Fe-Cr-W Alloy, and Ni-Cr-Mo-Cu Alloy Rod, Bar, and Wire",
    B333:  "Nickel-Molybdenum Alloy Plate, Sheet, and Strip",
    B335:  "Nickel-Molybdenum Alloy Rod",
    B408:  "Nickel-Iron-Chromium Alloy Rod and Bar",
    B425:  "Ni-Fe-Cr-Mo-Cu Alloy (UNS N08825, N08221, N06845) Rod and Bar",
    B435:  "UNS N06002, N06230, N12160, R30556 Plate, Sheet, and Strip",
    B446:  "Ni-Cr-Mo-Cb Alloy (UNS N06625), Ni-Cr-Mo-Si Alloy (UNS N06219), Ni-Cr-Mo-W Alloy (UNS N06650) Rod and Bar",
    B463:  "UNS N08020 Alloy Plate, Sheet, and Strip",
    B464:  "Welded UNS N08020 Alloy Pipe",
    B515:  "Welded UNS N08120, N08800, N08810, N08811 Alloy Tubes",
    B517:  "Welded Ni-Cr-Fe Alloy (UNS N06600, N06603, N06025, N06045) Pipe",
    B572:  "UNS N06002, N06230, N12160, R30556 Rod",
    B675:  "UNS N08367 Welded Pipe",
    B688:  "Chromium-Nickel-Molybdenum-Iron (UNS N08367) Plate, Sheet, and Strip",
    B704:  "Welded UNS N06625, N06219 and N08825 Alloy Tubes",
    B709:  "Iron-Nickel-Chromium-Molybdenum Alloy (UNS N08028) Plate, Sheet, and Strip",
    B729:  "Seamless UNS N08020, N08026, N08024 Nickel-Alloy Pipe and Tube",
    B804:  "UNS N08367 and N08926 Welded Pipe",

    /* --- Additional Carbon & Alloy Steel --- */
    A47:   "Ferritic Malleable Iron Castings",
    A48:   "Gray Iron Castings",
    A126:  "Gray Iron Castings for Valves, Flanges, and Pipe Fittings",
    A197:  "Cupola Malleable Iron",
    A204:  "Pressure Vessel Plates, Alloy Steel, Molybdenum",
    A270:  "Seamless and Welded Austenitic and Ferritic/Austenitic Stainless Steel Sanitary Tubing",
    A278:  "Gray Iron Castings for Pressure-Containing Parts for Temperatures Up to 650°F (350°C)",
    A302:  "Pressure Vessel Plates, Alloy Steel, Manganese-Molybdenum and Manganese-Molybdenum-Nickel",
    A334:  "Seamless and Welded Carbon and Alloy-Steel Tubes for Low-Temperature Service",
    A395:  "Ferritic Ductile Iron Pressure-Retaining Castings for Use at Elevated Temperatures",
    A426:  "Centrifugally Cast Ferritic Alloy Steel Pipe for High-Temperature Service",
    A437:  "Stainless and Alloy-Steel Turbine-Type Bolting Material Specially Heat Treated for High-Temperature Service",
    A451:  "Centrifugally Cast Austenitic Steel Pipe for High-Temperature Service",
    A453:  "High-Temperature Bolting, with Expansion Coefficients Comparable to Austenitic Stainless Steels",
    A487:  "Steel Castings Suitable for Pressure Service",
    A494:  "Castings, Nickel and Nickel Alloy",
    A524:  "Seamless Carbon Steel Pipe for Atmospheric and Lower Temperatures",
    A536:  "Ductile Iron Castings",
    A571:  "Austenitic Ductile Iron Castings for Pressure-Containing Parts Suitable for Low-Temperature Service",
    A645:  "Pressure Vessel Plates, 5% and 5½% Nickel Alloy Steels, Specially Heat Treated",
    A675:  "Steel Bars, Carbon, Hot-Wrought, Special Quality, Mechanical Properties",
    A696:  "Steel Bars, Carbon, Hot-Wrought or Cold-Finished, Special Quality, for Pressure Piping Components",
    A814:  "Cold-Worked Welded Austenitic Stainless Steel Pipe",
    A992:  "Structural Steel Shapes",
    A1010: "Higher-Strength Martensitic Stainless Steel Plate, Sheet, and Strip",
    A1011: "Steel, Sheet and Strip, Hot-Rolled, Carbon, Structural, High-Strength Low-Alloy",
    A1053: "Welded Ferritic-Martensitic Stainless Steel Pipe",

    /* --- Miscellaneous --- */
    B21:   "Naval Brass Rod, Bar, and Shapes",
    B61:   "Steam or Valve Bronze Castings",
    B62:   "Composition Bronze or Ounce Metal Castings",
    E112:  "Standard Test Methods for Determining Average Grain Size",
    F3125: "High Strength Structural Bolts, Steel and Alloy Steel, Heat Treated, 120 ksi and 150 ksi Minimum Tensile Strength",

    /* --- Low-Temperature Nickel Steels (for LNG / cryogenic) --- */
    A203:  "Pressure Vessel Plates, Alloy Steel, Nickel",
    A353:  "Pressure Vessel Plates, Alloy Steel, Double-Normalized and Tempered 9% Nickel",
    A553:  "Pressure Vessel Plates, Alloy Steel, Quenched and Tempered 7, 8, and 9 % Nickel",

    /* --- API Line Pipe --- */
    "API5L":"Line Pipe",

    /* --- CSA --- */
    "CSAZ245.1":"Steel Pipe"
  };


  /* ==================================================================
     ASME B31.3 TABLE A-1 NOTES  —  Curated for O&G piping materials
     ------------------------------------------------------------------
     Per ASME B31.3 – 2020 Edition. Only notes that have a practical
     impact on material selection, stress lookup, minimum temperature
     determination, or fabrication requirements for the grades typically
     used in Oil & Gas piping are included.

     Notes marked (*) restate Code text requirements.
     Deleted notes (16, 17, 18, 23, 38) are excluded.

     IMPORTANT: These are paraphrased engineering summaries for API
     tooltip / guidance use — NOT verbatim Code text. Always refer to
     the governing Code edition for contractual compliance.
     ================================================================== */
  const TABLE_A1_NOTES = {

    /* --- Column-heading notes (1–7): apply broadly --- */
    1:  { ref:"para. 302.3.1(a)",
          text:"Stress values in Table A-1 are basic allowable stresses in tension. For pressure design, multiply by the appropriate quality factor E (Ec from Table A-1A for castings, or Ej from Table A-1B for longitudinal weld joints). Shear and bearing stresses per para. 302.3.1(b); compression per para. 302.3.1(c)." },

    2:  { ref:"paras. 302.3.3, 302.3.4",
          text:"Casting quality factors (Ec) are per Table A-1A; longitudinal weld joint factors (Ej) are per Table A-1B. Both can be enhanced by supplementary examination per paras. 302.3.3(c) and 302.3.4(b)." },

    3:  { ref:"Material specification",
          text:"Stress values for austenitic stainless steels may not be applicable if the material has been given a final heat treatment other than that required by the material specification or by Notes (30)/(31)." },

    "4a":{ ref:"paras. 302.3.2(d)(3), 302.3.2(e)",
           text:"In Table A-1: italic stress values exceed ⅔ of expected yield strength at temperature; boldface values equal 90% of expected yield strength at temperature. Relevant for creep-range and time-dependent allowable stress considerations." },

    5:  { ref:"ASME BPVC Section IX, QW-200.3",
          text:"P-Numbers group materials for welding procedure qualification. Indicated by number or number+letter (e.g. 8, 5B, 11A)." },

    6:  { ref:"para. 323.2.2(e), Figure 323.2.2A",
          text:"The minimum temperature shown is the design minimum temperature for which the material is normally suitable without impact testing beyond that required by the material specification. Use of material colder than −29°C (−20°F) is governed by para. 323.2.2. For carbon steels with a LETTER designation (A, B, C, or D) in the Min. Temp. column, the actual minimum temperature depends on nominal wall thickness — see Figure 323.2.2A curves." },

    7:  { ref:"Material specification",
          text:"Letter 'a' = alloy not recommended for welding (must be individually qualified if welded). Letter 'b' = copper base alloy that must be individually qualified." },

    /* --- Material-specific notes (8+): curated for O&G relevance --- */
    8:  { ref:"paras. 305.2.1, 305.2.2, 323.4.2, 309.2",
          text:"Restrictions on use: (a) temperature limits −29°C to 186°C (−20°F to 366°F); (b) pipe shall be safeguarded outside those limits. Sub-notes (c)–(g) reference specific Code paragraphs for additional restrictions." },

    9:  { ref:"para. 326.2.1, para. 303",
          text:"For pressure-temperature ratings of components per standards in Table 326.1, see para. 326.2.1. Stress values may be used to calculate ratings for unlisted components or special ratings for listed components per para. 303." },

    12: { ref:"para. 323.3, Table 323.2.2",
          text:"Certain forms of this material must be impact tested to qualify for service below −29°C (−20°F), per Table 323.2.2. Alternatively, if impact testing is included in the material specification as invoked supplementary requirements, the material may be used down to the tested temperature." },

    13: { ref:"Material specification",
          text:"Properties vary with thickness or size. Stress values are based on minimum properties for the thickness listed." },

    14: { ref:"Material specification",
          text:"For use at stated stress values, minimum tensile and yield properties must be verified by tensile test. If not required by the material spec, specify in the purchase order." },

    15: { ref:"Engineering practice",
          text:"Stress values are based on strength only. For bolted joints requiring long-term leak-free service without retightening, lower stress values may be necessary based on flange/bolt flexibility and relaxation properties." },

    19: { ref:"Table 341.3.2, Table 302.3.4",
          text:"Specification includes random radiographic inspection for mill QC. If the 0.90 joint factor is to be used, welds shall meet Table 341.3.2 for longitudinal butt welds with spot radiography per Table 302.3.4. Requires special agreement between purchaser and manufacturer." },

    20: { ref:"Material specification",
          text:"For pipe sizes ≥DN 200 (NPS 8) with wall thicknesses ≥Sch 140, the specified minimum tensile strength is 483 MPa (70 ksi)." },

    25: { ref:"para. F323.4(c)",
          text:"This steel may develop embrittlement after service at approximately 316°C (600°F) and higher. Relevant for long-term elevated-temperature Cr-Mo service." },

    26: { ref:"para. F323.4(c)(2)",
          text:"Unstabilized austenitic stainless steel increasingly tends to precipitate intergranular carbides as carbon content increases above 0.03%. Affects corrosion resistance in sensitizing service." },

    27: { ref:"Material specification",
          text:"For temperatures above 427°C (800°F), stress values apply only when carbon content is 0.04% or higher." },

    28: { ref:"Material specification",
          text:"For temperatures above 538°C (1,000°F), stress values apply only when carbon content is 0.04% or higher." },

    29: { ref:"ASTM E112",
          text:"Stress values above 538°C (1,000°F) apply only when austenitic micrograin size per ASTM E112 is No. 6 or less (coarser grain). Otherwise use the lower stress values listed for the same material." },

    30: { ref:"Heat treatment requirement",
          text:"For temperatures above 538°C (1,000°F), stress values may be used only if material has been heat treated at minimum 1,093°C (2,000°F) and quenched in water or rapidly cooled." },

    31: { ref:"Heat treatment requirement",
          text:"For temperatures above 538°C (1,000°F), stress values may be used only if material has been heat treated at minimum 1,038°C (1,900°F) and quenched in water or rapidly cooled." },

    32: { ref:"Material specification",
          text:"Stress values are for the lowest strength base material permitted by the fitting specification. If a higher strength base material is used, the higher stress values for that material may be used in design." },

    35: { ref:"para. F323.4(c)(4)",
          text:"Steel intended for high-temperature use; may have low ductility and/or low impact properties at room temperature after service above the indicated temperature. Relevant for Cr-Mo grades in elevated-temperature shutdown/startup scenarios." },

    36: { ref:"para. 323.3",
          text:"Specification permits material to be furnished without solution heat treatment. When not solution heat treated, minimum temperature shall be −29°C (−20°F) unless impact tested per para. 323.3." },

    37: { ref:"A312, A240, A182",
          text:"Impact requirements for seamless fittings are governed by those listed for the particular base material specification. When A276 materials are used, the notes, minimum temperatures, and allowable stresses for comparable grades of A240 apply." },

    39: { ref:"Impact test requirement",
          text:"Material used below −29°C (−20°F) shall be impact tested if carbon content is above 0.10%." },

    40: { ref:"para. 302.3.3(c), Table 302.3.3C",
          text:"Casting quality factor can be enhanced by supplementary examination per Table 302.3.3C. The higher factor may be substituted in pressure design equations." },

    41: { ref:"Material specification",
          text:"Design stresses for the cold drawn temper are based on hot rolled properties until required data on cold drawn are submitted." },

    42: { ref:"Product specification (A193/A194)",
          text:"This is a product specification; no design stresses are necessary. Metal temperature limits vary by grade: Gr.1 −29 to 482°C; Gr.2/2H/2HM −48 to 593°C; Gr.3 −29 to 593°C; Gr.6 −29 to 427°C; Gr.7 −48 to 593°C; Gr.7L −101 to 593°C; Gr.7M −48 to 593°C; Gr.7ML −73 to 593°C; Gr.8FA [see Note (39)] −29 to 427°C; Gr.8MA/8TA −198 to 816°C; Gr.8/8A/8CA −254 to 816°C." },

    "42b":{ ref:"Product specification",
            text:"This is a product specification; no design stresses are necessary. For usage limitations, see paras. 309.2.1 and 309.2.2." },

    43: { ref:"para. 323.4.2(c)",
          text:"Stress values are not applicable when either welding or thermal cutting is employed." },

    45: { ref:"Material specification",
          text:"Stress values shown are applicable for die forgings only." },

    46: { ref:"A312 para. 6.1.4",
          text:"Lines of allowable stresses in Table A-1 for all A312 materials include heavily cold worked (HCW) material as defined in A312 para. 6.1.4." },

    47: { ref:"Material specification",
          text:"If no welding is employed in fabrication, stress values may be increased to 230 MPa (33.3 ksi)." },

    48: { ref:"Material specification",
          text:"The stress value for this gray iron material at its upper temperature limit of 232°C (450°F) is the same as that shown in the 204°C (400°F) column." },

    49: { ref:"Material specification",
          text:"If the chemical composition of this grade renders it hardenable, qualification under P-No. 6 is required." },

    50: { ref:"Material specification",
          text:"This material is grouped in P-No. 7 because its hardenability is low." },

    51: { ref:"ASME BPVC Section IX QW/QB-422",
          text:"This material may require special consideration for welding qualification. A qualified WPS is required for each strength level of material." },

    52: { ref:"Engineering practice",
          text:"Copper-silicon alloys are not always suitable when exposed to certain media and high temperature, particularly above 100°C (212°F). The user should verify the alloy is satisfactory for the intended service." },

    53: { ref:"Heat treatment requirement",
          text:"Stress relief heat treatment is required for service above 232°C (450°F)." },

    54: { ref:"Material specification",
          text:"Maximum operating temperature is arbitrarily set at 260°C (500°F) because hard temper adversely affects design stress in the creep rupture temperature ranges." },

    55: { ref:"Material specification (API 5L)",
          text:"Pipe produced to this specification is not intended for high temperature service. Stress values apply to either non-expanded or cold expanded material in the as-rolled, normalized, or normalized and tempered condition." },

    56: { ref:"Engineering practice",
          text:"Because of thermal instability, this material is not recommended for service above 427°C (800°F)." },

    57: { ref:"para. F323.4(b)(2)",
          text:"Conversion of carbides to graphite may occur after prolonged exposure to temperatures over 427°C (800°F). See para. F323.4(b)(2)." },

    58: { ref:"para. F323.4(b)(3)",
          text:"Conversion of carbides to graphite may occur after prolonged exposure to temperatures over 468°C (875°F). See para. F323.4(b)(3)." },

    59: { ref:"para. F323.4(b)(4)",
          text:"For temperatures above 482°C (900°F), consider the advantages of killed steel. See para. F323.4(b)(4)." },

    60: { ref:"Material specification (A193 bolting)",
          text:"For all design temperatures, maximum hardness shall be Rockwell C35 immediately under thread roots. Hardness taken on a flat area at least 3 mm (⅛ in.) across, prepared by removing threads. Determination made at same frequency as tensile tests." },

    61: { ref:"Heat treatment",
          text:"Annealed at approximately 982°C (1,800°F)." },

    62: { ref:"Heat treatment",
          text:"Annealed at approximately 1,121°C (2,050°F)." },

    63: { ref:"Material specification (aluminium)",
          text:"For stress relieved tempers (T351, T3510, T3511, T451, T4510, T4511, T651, T6510, T6511), stress values for material in the listed temper shall be used." },

    64: { ref:"ASME BPVC Section IX QW-462.1",
          text:"The minimum tensile strength of the reduced section tensile specimen per QW-462.1 shall not be less than 758 MPa (110.0 ksi)." },

    65: { ref:"Material specification (A203 Ni steel plates)",
          text:"The minimum temperature shown is for the heaviest wall meeting spec mechanical properties. For lighter walls: A203 A/B max 51 mm → −68°C, over 51–76 mm → −59°C; A203 D/E max 51 mm → −101°C, over 51–76 mm → −87°C." },

    66: { ref:"Material specification",
          text:"Stress values shown are 90% of those for the corresponding core material." },

    67: { ref:"para. 331, A671/A672/A691",
          text:"For use under this Code, heat treatment requirements for pipe manufactured to A671, A672, and A691 shall be as required by para. 331 for the particular material being used." },

    68: { ref:"Material specification",
          text:"Tension test specimen from plate 12.7 mm (½ in.) and thicker is machined from the core and does not include cladding alloy; therefore, stress values listed are for materials less than 12.7 mm." },

    69: { ref:"Pressure limitation",
          text:"This material may be used only in non-pressure applications." },

    70: { ref:"Engineering practice (Alloy 625)",
          text:"Alloy 625 (UNS N06625) in the annealed condition is subject to severe loss of impact strength at room temperature after exposure in the range 538°C to 760°C (1,000°F to 1,400°F)." },

    71: { ref:"Material specification (API 5L / HSLA)",
          text:"These materials are normally microalloyed with Cb, V, and/or Ti. Supplemental specifications commonly establish more restrictive chemistry, plate rolling specifications, and requirements for weldability (C-equivalent) and toughness." },

    72: { ref:"Welding requirement",
          text:"For service temperature above 454°C (850°F), weld metal shall have a carbon content greater than 0.05%." },

    73: { ref:"Table 331.1.1 (zirconium)",
          text:"Heat treatment is required after welding for all products of zirconium Grade R60705. See Table 331.1.1." },

    74: { ref:"B366 Table 2",
          text:"Mechanical properties of fittings made from forging stock shall meet minimum tensile requirements of one of the bar, forging, or rod specifications listed in Table 2 of B366 for which tensile testing is required." },

    75: { ref:"Material specification (Cr-Mo)",
          text:"Stress values shown are for materials in the normalized and tempered condition, or when heat treatment is unknown. If material is annealed, use reduced values above 510°C (950°F): 538°C → 55.1 MPa; 566°C → 39.3 MPa; 593°C → 26.2 MPa; 621°C → 16.5 MPa; 649°C → 9.6 MPa." },

    77: { ref:"CSA Z245.1 equivalence",
          text:"Pipe grades produced per CSA Z245.1 are considered equivalent to API 5L and treated as listed materials. Equivalents: B↔241, X42↔290, X46↔317, X52↔359, X56↔386, X60↔414, X65↔448, X70↔483, X80↔550." },

    78: { ref:"Table 302.3.5",
          text:"Not permitted for the P4 and P5 materials in Table 302.3.5 for Elevated Temperature Fluid Service." },

    79: { ref:"para. 323.3",
          text:"For use under this Code, impact testing shall be performed per para. 323.3 at the design minimum temperature but not warmer than −29°C (−20°F)." },

    /* --- Additional notes from earlier range not previously included --- */
    "9a":{ ref:"Table 326.1, B564",
           text:"Component standards in Table 326.1 impose the following restrictions on this material when used as a forging: composition, properties, heat treatment, and grain size shall conform to this specification; manufacturing procedures, tolerances, tests, certification, and markings shall be per ASTM B564." },

    10: { ref:"para. 302.3.3",
          text:"This casting quality factor is applicable only when proper supplementary examination has been performed." },

    11: { ref:"Heat treatment",
          text:"For use under this Code, radiography shall be performed after heat treatment." },

    21: { ref:"Material specification",
          text:"For material thickness greater than 127 mm (5 in.), the specified minimum tensile strength is 483 MPa (70 ksi)." },

    "21a":{ ref:"Material specification",
            text:"For material thickness greater than 127 mm (5 in.), the specified minimum tensile strength is 448 MPa (65 ksi)." },

    22: { ref:"Material specification",
          text:"Minimum tensile strength for weld qualification and stress values shown shall be multiplied by 0.90 for pipe with OD less than 51 mm (2 in.) and D/t less than 15. May be waived if the welding procedure consistently produces welds meeting the listed minimum tensile strength of 165 MPa (24 ksi)." },

    24: { ref:"Material specification",
          text:"Yield strength is not stated in the material specification. The value shown is based on yield strengths of materials with similar characteristics." },

    33: { ref:"Welding practice",
          text:"For welded construction with work hardened grades, use stress values for annealed material; for welded construction with precipitation hardened grades, use special stress values for welded construction given in the Tables." },

    34: { ref:"Welding/brazing/soldering",
          text:"If material is welded, brazed, or soldered, the allowable stress values for the annealed condition shall be used." }
  };

  /* --- General Notes for Tables A-1, A-1A, A-1B, A-2, A-2M --- */
  const TABLE_A1_GENERAL_NOTES = {
    a: "The allowable stress values, P-Number assignments, weld joint and casting quality factors, and minimum temperatures in Tables A-1, A-1A, A-1B, A-2, and A-2M, together with the referenced Notes in the stress tables, are requirements of this Code.",
    b: "Notes (1) through (7) are referenced in column headings and body headings for material type and product form; Notes (8) and following are referenced in the Notes column for specific materials. Notes marked with an asterisk (*) restate requirements found in the text of the Code.",
    c: "The stress values given in ksi (Tables A-1/A-2) and in MPa (Tables A-1M/A-2M) may be used. The ksi and MPa values are not exact equivalents; for any given material, use only one system consistently.",
    d: "Copper and copper alloy temper symbols: H = drawn; H01 = quarter hard; H02 = half hard; H06 = extra hard; H55 = light drawn; H58 = drawn general purpose; H80 = hard drawn; HR50 = drawn stress relieved; M20 = hot rolled; O25 = hot rolled annealed; O50 = light annealed; O60 = soft annealed; O61 = annealed; WO50 = welded annealed; WO61 = welded fully finished annealed.",
    e: "Nickel and nickel alloy Class column abbreviations: ann. = annealed; C.D. = cold worked; forg. = forged; H.F. = hot finished; H.R. = hot rolled; H.W. = hot worked; plt. = plate; R. = rolled; rel. = relieved; sol. = solution; str. = stress; tr. = treated.",
    f: "Table A-1M Product Form abbreviations: forg. = forgings; ftg. = fittings; pl. = plate; shps. = shapes; sht. = sheet; smls. = seamless; struct. = structural; wld. = welded."
  };

  /* --- Deleted notes (for completeness / cross-reference) --- */
  const TABLE_A1_DELETED_NOTES = [16, 17, 18, 23, "42a", 44, 38, 76];


  /* ==================================================================
     P-NUMBERS — Base Metal Groupings for Welding Qualification
     ------------------------------------------------------------------
     Per ASME BPVC Section IX, QW-200.3 and QW/QB-422.
     P-Numbers group similar base metals so that qualification of a
     welding procedure on one material in a P-Number group qualifies the
     procedure for all materials in that group (subject to other essential
     variable restrictions).

     Referenced by Table A-1 Note (5).
     ================================================================== */
  const P_NUMBERS = {
    1:    { metal:"Carbon Manganese Steels", groups:4,
            typical:"A106 Gr.B, A53 Gr.B, A333 Gr.6, A516 Gr.60/70, A105, A234 WPB, API 5L B/X42–X80" },
    2:    { metal:"Not Used", groups:0, typical:"—" },
    3:    { metal:"½Mo or ½Cr-½Mo Steels", groups:3,
            typical:"A335 P1, A234 WP1, A182 F1" },
    4:    { metal:"1¼Cr-½Mo Steels", groups:2,
            typical:"A335 P11, A234 WP11, A182 F11" },
    "5A": { metal:"2¼Cr-1Mo Steels", groups:1,
            typical:"A335 P22, A234 WP22, A182 F22" },
    "5B": { metal:"5Cr-½Mo or 9Cr-1Mo Steels", groups:2,
            typical:"A335 P5, P9, A182 F5, F9" },
    "5C": { metal:"Cr-Mo-V Steels", groups:5,
            typical:"A335 P91, A182 F91" },
    6:    { metal:"Martensitic Stainless Steels", groups:6,
            typical:"Grade 410, 415, 429" },
    7:    { metal:"Ferritic Stainless Steels", groups:1,
            typical:"Grade 409, 430" },
    8:    { metal:"Austenitic Stainless Steels", groups:4,
            typical:"Gr.1: 304, 316, 317, 347; Gr.2: 309, 310; Gr.3: High Mn; Gr.4: High Mo" },
    "9A": { metal:"2–4% Nickel Steels", groups:1, typical:"A203 Gr.A/B (2¼Ni)" },
    "9B": { metal:"2–4% Nickel Steels", groups:1, typical:"A203 Gr.D/E (3½Ni)" },
    "9C": { metal:"2–4% Nickel Steels", groups:1, typical:"—" },
    "10A":{ metal:"Various Low Alloy Steels", groups:1, typical:"Cr-V, Mn-V steels" },
    "10B":{ metal:"Various Low Alloy Steels", groups:1, typical:"—" },
    "10C":{ metal:"Various Low Alloy Steels", groups:1, typical:"—" },
    "10F":{ metal:"Various Low Alloy Steels", groups:1, typical:"—" },
    "10H":{ metal:"Duplex and Super Duplex Stainless Steel", groups:1,
            typical:"S31803 (2205), S32750 (2507)" },
    "10I":{ metal:"High Chromium Stainless Steel", groups:1, typical:"—" },
    "10J":{ metal:"High Chromium, Molybdenum Stainless Steel", groups:1, typical:"—" },
    "10K":{ metal:"High Chromium, Molybdenum, Nickel Stainless Steel", groups:1, typical:"—" },
    "11A":{ metal:"Various High Strength Low Alloy Steels", groups:6,
            typical:"A694 F52–F70, A860 WPHY grades" },
    "11B":{ metal:"Various High Strength Low Alloy Steels", groups:10, typical:"—" },
    "15E":{ metal:"9Cr-1Mo (modified) Steels", groups:1,
            typical:"A335 P91/P92, A182 F91/F92" },
    21:   { metal:"Aluminium — High Al Content", groups:1, typical:"1000 and 3000 series" },
    22:   { metal:"Aluminium — 5000 Series", groups:1, typical:"5052, 5454" },
    23:   { metal:"Aluminium — 6000 Series", groups:1, typical:"6061, 6063" },
    25:   { metal:"Aluminium — 5000 Series (High Mg)", groups:1, typical:"5083, 5086, 5456" },
    31:   { metal:"High Copper Content", groups:1, typical:"Cu pipe/tube (B42, B75)" },
    32:   { metal:"Brass", groups:1, typical:"Cu-Zn alloys" },
    33:   { metal:"Copper Silicon", groups:1, typical:"Cu-Si alloys (B96, B98)" },
    34:   { metal:"Copper Nickel", groups:1, typical:"Cu-Ni 90/10, 70/30 (B466, B467)" },
    35:   { metal:"Copper Aluminium", groups:1, typical:"Al-Bronze (B148, B150)" },
    41:   { metal:"High Nickel Content", groups:1, typical:"Nickel 200/201 (B161, B162)" },
    42:   { metal:"Nickel-Copper", groups:1, typical:"Monel 400/K-500 (B165, B164)" },
    43:   { metal:"Nickel-Chromium-Iron", groups:1,
            typical:"Inconel 600/625, Hastelloy C22/C276/X (B167, B444, B574)" },
    44:   { metal:"Nickel-Molybdenum", groups:1, typical:"Hastelloy B2 (B333, B335)" },
    45:   { metal:"Nickel-Chromium-Silicon", groups:1, typical:"—" },
    46:   { metal:"Nickel-Chromium-Silicone", groups:1, typical:"—" },
    47:   { metal:"Nickel-Chromium-Tungsten", groups:1, typical:"—" },
    51:   { metal:"Titanium Alloys — Unalloyed", groups:1, typical:"Gr.1, Gr.2 (B861, B862)" },
    52:   { metal:"Titanium Alloys — Alpha/Near-Alpha", groups:1, typical:"Gr.5, Gr.12" },
    53:   { metal:"Titanium Alloys — Alpha-Beta", groups:1, typical:"—" },
    61:   { metal:"Zirconium Alloys — Unalloyed", groups:1, typical:"R60702 (B523, B550)" },
    62:   { metal:"Zirconium Alloys — Alloyed", groups:1, typical:"R60705" },
    81:   { metal:"Cobalt and Cobalt-Based Alloys", groups:1, typical:"—" }
  };


  /* ==================================================================
     A-NUMBERS — Weld Metal Classification (Ferrous Only)
     ------------------------------------------------------------------
     Per ASME BPVC Section IX, Table QW-442.
     The A-Number classifies ferrous weld metal deposits by chemical
     composition for procedure qualification. It is an essential variable
     for several welding processes.

     Values shown are maximum percentages unless a range is given.
     ================================================================== */
  const A_NUMBERS = {
    1:  { type:"Mild Steel",
          C:0.20, Cr:0.20, Mo:0.30, Ni:0.50, Mn:1.60, Si:1.00 },
    2:  { type:"Carbon-Molybdenum",
          C:0.15, Cr:0.50, Mo:"0.40–0.65", Ni:0.50, Mn:1.60, Si:1.00 },
    3:  { type:"Chrome (0.4–2%)-Molybdenum",
          C:0.15, Cr:"0.40–2.00", Mo:"0.40–0.65", Ni:0.50, Mn:1.60, Si:1.00 },
    4:  { type:"Chrome (2–4%)-Molybdenum",
          C:0.15, Cr:"2.00–4.00", Mo:"0.40–1.50", Ni:0.50, Mn:1.60, Si:2.00 },
    5:  { type:"Chrome (4–10.5%)-Molybdenum",
          C:0.15, Cr:"4.00–10.50", Mo:"0.40–1.50", Ni:0.80, Mn:1.20, Si:2.00 },
    6:  { type:"Chrome-Martensitic",
          C:0.15, Cr:"11.00–15.00", Mo:0.70, Ni:0.80, Mn:2.00, Si:1.00 },
    7:  { type:"Chrome-Ferritic",
          C:0.15, Cr:"11.00–30.00", Mo:1.00, Ni:0.80, Mn:1.00, Si:3.00 },
    8:  { type:"Chromium-Nickel (Austenitic)",
          C:0.15, Cr:"14.50–30.00", Mo:4.00, Ni:"7.50–15.00", Mn:2.50, Si:1.00 },
    9:  { type:"Chromium-Nickel (High Ni Austenitic)",
          C:0.30, Cr:"19.00–30.00", Mo:6.00, Ni:"15.00–37.00", Mn:2.50, Si:1.00 },
    10: { type:"Nickel to 4%",
          C:0.15, Cr:0.50, Mo:0.55, Ni:"0.80–4.00", Mn:1.70, Si:1.00 },
    11: { type:"Manganese-Molybdenum",
          C:0.17, Cr:0.50, Mo:"0.25–0.75", Ni:0.85, Mn:"1.25–2.25", Si:1.00 },
    12: { type:"Nickel-Chrome-Molybdenum",
          C:0.15, Cr:1.50, Mo:"0.25–0.80", Ni:"1.25–2.80", Mn:"0.75–2.25", Si:1.00 },
    _notes: [
      "Single values shown are maximum percentages.",
      "Only listed elements are used to determine A-Numbers."
    ]
  };


  /* ==================================================================
     FIGURE 323.2.2A — Impact Test Exemption Curves & Notes
     ------------------------------------------------------------------
     For carbon steels with a letter designation (A, B, C, D) in the
     Min. Temp. column of Table A-1. The actual minimum design metal
     temperature (MDMT) without impact testing depends on the nominal
     wall thickness — read from the applicable curve in Figure 323.2.2A.

     CURVE ASSIGNMENTS (typical, from Code and Figure notes):
       A — Most conservative (warmest MDMT for given thickness).
           e.g. A515, A516 (non-normalized), A671/A672 from A515 plate
       B — Moderate. e.g. A53 Gr.B, A106 Gr.B, A135 Gr.B,
           API 5L X-grades (if normalized or Q&T — see Note 3)
       C — Less conservative. e.g. A516 all grades (if normalized —
           see Note 4 below re Curve D option), A537 Cl.1
       D — Least conservative (coldest MDMT for given thickness).
           e.g. A516 all grades IF normalized (per Note 4),
           A671/A672 from normalized A516 plate (per Note 4),
           A333 Gr.1 & Gr.6, A334 Gr.1 & Gr.6

     FIGURE 323.2.2A NOTES (from the Code figure):
       (1) For blind flanges and blanks with a letter designation,
           T = ¼ of total thickness (including facing thickness).
       (2) Any carbon steel may be used to −29°C (−20°F) for
           Category D Fluid Service.
       (3) API 5L X-grades and A381 may use Curve B if normalized
           or quenched and tempered.
       (4) The following may use Curve D if normalized:
           (a) A516 plate, all grades
           (b) A671 pipe made from A516 plate, all grades
           (c) A672 pipe made from A516 plate, all grades
       (5) Welding procedure for manufacture of pipe/components shall
           include impact testing of welds and HAZ for any MDMT below
           −29°C (−20°F), except as provided in Table 323.2.2 A-3(b).
       (6) Impact testing per para. 323.3 is required for any MDMT
           below −48°C (−55°F), except as permitted by Table 323.2.2
           Note (3).

     DIGITISED CURVE DATA (approximate, from Figure 323.2.2A):
       Thickness in mm, temperature in °C.
       For intermediate values, interpolate linearly.
     ================================================================== */
  const CURVES_323 = {
    description: "ASME B31.3 Figure 323.2.2A — Impact Test Exemption Curves. " +
                 "MDMT (°C) vs nominal thickness (mm). Interpolate linearly for intermediate thicknesses.",
    thickness_mm: [6, 8, 10, 13, 16, 19, 25, 32, 38, 50, 64, 75, 100, 125, 150],
    /* Temperatures in °C for each thickness point above */
    A: [-18, -12, -7, -1, 4, 9, 16, 22, 27, 33, 38, 41, 47, 51, 54],
    B: [-30, -26, -22, -18, -14, -10, -4, 1, 6, 12, 17, 20, 26, 30, 33],
    C: [-40, -37, -34, -30, -27, -23, -18, -13, -9, -3, 2, 5, 10, 14, 17],
    D: [-52, -49, -46, -43, -40, -37, -33, -29, -25, -20, -16, -13, -8, -4, -1],
    notes: {
      1: "For blind flanges/blanks with letter designation, T = ¼ of total thickness including facing.",
      2: "Any carbon steel may be used to −29°C (−20°F) for Category D Fluid Service.",
      3: "API 5L X-grades and A381 may use Curve B if normalized or quenched and tempered.",
      4: "A516 plate (all grades), A671 and A672 pipe from A516 plate may use Curve D if normalized.",
      5: "Welding procedure shall include weld/HAZ impact testing for any MDMT below −29°C (−20°F), except per Table 323.2.2 A-3(b).",
      6: "Impact testing per para. 323.3 required for any MDMT below −48°C (−55°F), except per Table 323.2.2 Note (3)."
    }
  };

  /* ---- helper: look up MDMT from curve designation and thickness ---- */
  function curveMDMT(curve, thickness_mm) {
    const t = CURVES_323.thickness_mm;
    const temps = CURVES_323[curve];
    if (!temps) return null;
    if (thickness_mm <= t[0]) return { mdmt_C: temps[0], clamp: "below_min_thickness" };
    if (thickness_mm >= t[t.length - 1]) return { mdmt_C: temps[temps.length - 1], clamp: "above_max_thickness" };
    for (let i = 0; i < t.length - 1; i++) {
      if (thickness_mm >= t[i] && thickness_mm <= t[i + 1]) {
        const f = (thickness_mm - t[i]) / (t[i + 1] - t[i]);
        return { mdmt_C: Math.round(temps[i] + f * (temps[i + 1] - temps[i])), clamp: null };
      }
    }
    return null;
  }


  /* ==================================================================
     ASME B31.3 PARA. 323 — GENERAL MATERIAL REQUIREMENTS
     ------------------------------------------------------------------
     Per ASME B31.3 – 2020 Edition, Chapter III.
     Paraphrased engineering summaries for API guidance — NOT verbatim
     Code text. Always refer to the governing Code edition for
     contractual compliance.

     Structured for use as tooltip / guidance content in the API response
     when a user queries material suitability, temperature limits, or
     impact testing requirements.
     ================================================================== */
  const PARA_323 = {

    /* --- 323.1 Materials and Specifications --- */
    "323.1": {
      "323.1.1": {
        title: "Listed Materials",
        text: "Any material used in pressure-containing piping components shall conform to a listed specification, except as provided in para. 323.1.2."
      },
      "323.1.2": {
        title: "Unlisted Materials",
        text: "Unlisted materials may be used provided they conform to a published specification covering chemistry, physical and mechanical properties, method and process of manufacture, heat treatment, and quality control, and otherwise meet Code requirements. Allowable stresses shall be determined per the Code's allowable stress basis or a more conservative basis. See also ASME BPVC Section II Part D Appendix 5."
      },
      "323.1.3": {
        title: "Unknown Materials",
        text: "Materials of unknown specification shall not be used for pressure-containing piping components."
      },
      "323.1.4": {
        title: "Reclaimed Materials",
        text: "Reclaimed pipe and components may be used if properly identified as conforming to a listed or published specification and meeting Code requirements. Sufficient cleaning and inspection shall determine minimum wall thickness and freedom from unacceptable imperfections."
      }
    },

    /* --- 323.2 Temperature Limitations --- */
    "323.2": {
      preamble: "The designer shall verify that materials meeting other Code requirements are suitable for service throughout the operating temperature range.",

      "323.2.1": {
        title: "Upper Temperature Limits, Listed Materials",
        text: "A listed material may be used above the maximum temperature for which a stress value or rating is shown, only if: (a) there is no prohibition in Appendix A or elsewhere in the Code; and (b) the designer verifies serviceability per para. 323.2.4."
      },

      "323.2.2": {
        title: "Lower Temperature Limits, Listed Materials",
        preamble: "Listed materials shall be impact tested as described in Table 323.2.2 except as exempted by (d) through (j). See Appendix F, para. F323.2.2.",
        clauses: {
          a: {
            text: "The allowable stress or component rating at any temperature colder than the minimum shown in Table A-1 or Figure 323.2.2A shall not exceed the stress value or rating at the minimum temperature."
          },
          b: {
            title: "Stress Ratio (for Figure 323.2.2B temperature reduction)",
            text: "The stress ratio is used in Figure 323.2.2B to determine the allowable reduction in impact test exemption temperature. It is defined as the maximum of: (1) circumferential pressure stress / basic allowable stress; (2) for rated components, pressure / pressure rating; (3) combined stress (pressure + dead + live + displacement strain) / basic allowable stress — calculated using nominal dimensions with all stress indices = 1.0, section properties based on nominal dimensions less allowances."
          },
          c: {
            title: "Conditions for Temperature Reduction",
            text: "Minimum impact test exemption temperature reduction (via Figure 323.2.2B) may only be used when ALL of: (1) piping is not in Elevated Temperature Fluid Service; (2) local stresses from shock, thermal bowing, and dissimilar metal differential expansion are less than 10% of basic allowable stress; (3) piping is safeguarded from maintenance loads."
          },
          d: {
            title: "Base Metal Exemption",
            text: "Impact testing of base metal is not required if the design minimum temperature is warmer than or equal to the Min. Temp. column value in Table A-1, except for austenitic stainless steel per Table 323.2.2 Box A-4(a). Welds may still require impact testing per (f) or Table 323.2.2 Box B-6."
          },
          e: {
            title: "Carbon Steel Letter Designation (Curves A/B/C/D)",
            text: "For carbon steels with a letter designation in the Min. Temp. column, the minimum temperature is defined by the applicable curve and notes in Figure 323.2.2A. If the design minimum temperature–thickness combination is on or above the curve, the impact testing exemption in (d) applies. Use PPA.curveMDMT() to look up the MDMT for a given curve and thickness."
          },
          f: {
            title: "Weld Impact Testing",
            text: "For steel materials, impact testing of welds (including manufacturing welds such as seam-welded pipe and welded tees) is required if either base material requires impact testing OR if the design minimum temperature is colder than −18°C (0°F). Exceptions: manufacturing welds in austenitic stainless steel with C ≤ 0.10% in solution heat treated condition, or per Table 323.2.2 Boxes A-3(b) and A-4(b). Production weld impact testing per Table 323.2.2 Note (2)."
          },
          g: {
            title: "Low Stress Ratio Exemption",
            text: "For steels (including welds), impact testing is not required if stress ratio ≤ 0.3, design minimum temperature ≥ −104°C (−155°F), and conditions of (c) apply."
          },
          h: {
            title: "Temperature Reduction — Without Impact Testing",
            text: "For carbon, low alloy, and intermediate alloy steel materials (including welds) NOT qualified by impact testing: the minimum temperature from Table A-1 or Figure 323.2.2A may be reduced to no colder than −48°C (−55°F) using Figure 323.2.2B, when (c) applies. For welds requiring impact testing per Table 323.2.2 Box A-3(b), the temperature reduction is applied from −29°C (−20°F)."
          },
          i: {
            title: "Temperature Reduction — With Impact Testing",
            text: "For carbon, low alloy, and intermediate alloy steel materials (including welds) that HAVE been qualified by impact testing: the permitted design minimum temperature may be reduced to no colder than −104°C (−155°F) using Figure 323.2.2B, when (c) applies."
          },
          j: {
            title: "Weld Metal Exemptions (Austenitic)",
            text: "Impact testing is not required for: (1) austenitic stainless steel base materials with C ≤ 0.10%, welded without filler metal, at MDMT ≥ −104°C (−155°F); (2a) austenitic weld metal with C ≤ 0.10%, filler metals per AWS A5.4/A5.9/A5.11/A5.14/A5.221, at MDMT ≥ −104°C (−155°F); (2b) austenitic weld metal with C > 0.10%, same AWS fillers, at MDMT ≥ −48°C (−55°F)."
          }
        }
      },

      "323.2.3": {
        title: "Temperature Limits, Unlisted Materials",
        text: "An unlisted material acceptable under para. 323.1.2 shall be qualified for service at all temperatures within a stated range, from design minimum to design maximum temperature, per para. 323.2.4."
      },

      "323.2.4": {
        title: "Verification of Serviceability",
        text: "When an unlisted material is to be used, or when a listed material is used above the highest temperature for which stress values appear in Appendix A, the designer is responsible for demonstrating the validity of allowable stresses and other design limits."
      }
    },

    /* --- Table 323.2.2 Notes --- */
    "Table_323.2.2_notes": {
      1: "Carbon steels subject to Box B-2 limitations: plates per A36, A283, A570; pipe per A134 made from these plates; structural shapes per A992; pipe per A53 Type F and API 5L Gr. A25 butt weld.",
      2: "Impact tests meeting Table 323.3.1 requirements, performed as part of weld procedure qualification, satisfy all para. 323.2.2 requirements and need not be repeated for production welds.",
      3: "See paras. 323.2.2(g) through (i) for stress-ratio-based exemptions and temperature reductions.",
      4: "Impact tests are not required when maximum obtainable Charpy specimen width along the notch is less than 2.5 mm (0.098 in.). Under these conditions, if stress ratio > 0.3, MDMT shall not be colder than the lower of −48°C (−55°F) or the Table A-1 minimum. See also para. 323.2.2(g).",
      5: "Impact tests are not required when maximum obtainable Charpy specimen width along the notch is less than 2.5 mm (0.098 in.).",
      6: "For austenitic stainless steels, impact testing is not required if MDMT ≥ −104°C (−155°F) and stress ratio ≤ 0.3. See also para. 323.2.2(g).",
      7: "Alternative tests may include tensile elongation, sharp-notch tensile strength (compared with unnotched), or other tests conducted at or colder than design minimum temperature. See also para. 323.3.4."
    }
  };


  /* ---- SUPPLEMENTARY: relative cost multiplier (NOT real pricing) ----
     Directional only. Mill/market pricing (especially Ni/Mo-bearing alloys)
     moves with commodity cycles and varies by region, order volume and mill,
     so an absolute figure would go stale and could mislead a decision. This
     is a rough relative multiplier vs A106B = 1.0 baseline, for a same-size
     pipe/fitting, material cost only (no fabrication/welding cost included —
     see WELD for that dimension separately). Always confirm against current
     mill quotes before using in an estimate. */
  const COST = {
    A106B:1.0, "A333-6":1.3, TP304:3.0, TP316L:3.5, DUP2205:5.5, P11:1.8, P22:2.2
  };



  /* ---- interpolation (clamps at table ends) ---- */
  function interp(arr, ts, x) {
    if (x <= ts[0])              return { v: arr[0], clamp: x < ts[0] ? 'low' : null };
    if (x >= ts[ts.length - 1])  return { v: arr[arr.length - 1], clamp: x > ts[ts.length - 1] ? 'high' : null };
    for (let i = 0; i < ts.length - 1; i++) {
      if (x >= ts[i] && x <= ts[i + 1]) {
        const f = (x - ts[i]) / (ts[i + 1] - ts[i]);
        return { v: arr[i] + f * (arr[i + 1] - arr[i]), clamp: null };
      }
    }
    return { v: arr[0], clamp: null };
  }

  /* ---- deterministic converters (US Customary is canonical) ---- */
  const f2c = f => (f - 32) * 5 / 9;
  const c2f = c => c * 9 / 5 + 32;
  const convert = {
    f2c, c2f,
    stress: (ksi, u) => u === 'US' ? +(+ksi).toFixed(1)  : +(ksi * 6.895).toFixed(0),     // ksi | MPa
    modE  : (e6,  u) => u === 'US' ? +(+e6).toFixed(1)   : +(e6 * 6895).toFixed(0),       // ×10⁶ psi | MPa
    alpha : (a,   u) => u === 'US' ? +(+a).toFixed(2)    : +(a * 9 / 5).toFixed(2),       // ×10⁻⁶/°F | /°C
    temp  : (f,   u) => u === 'US' ? Math.round(f)       : Math.round(f2c(f))             // °F | °C
  };
  const UNITS = {
    US: { stress:"ksi", e:"×10⁶ psi", a:"×10⁻⁶/°F", t:"°F" },
    SI: { stress:"MPa", e:"MPa",      a:"×10⁻⁶/°C", t:"°C" }
  };

  /* ---- convenience helpers ---- */
  function getE(matKey, tempF) {
    const m = MATERIALS[matKey]; if (!m) return null;
    const g = E_GROUPS[m.eGrp]; if (!g) return null;
    return interp(g.e, g.t, tempF);
  }
  function getAlpha(matKey, tempF) {
    const m = MATERIALS[matKey]; if (!m) return null;
    const g = A_GROUPS[m.aGrp]; if (!g) return null;
    return interp(g.a, g.t, tempF);
  }

  g.PPA = g.PPA || {};
  Object.assign(g.PPA, {
    MATERIALS, E_GROUPS, A_GROUPS, EJ, EC, RHO, COST, WELD, WELD_LEVEL_RANK,
    ASTM_SPECS, TABLE_A1_NOTES, TABLE_A1_GENERAL_NOTES, TABLE_A1_DELETED_NOTES,
    P_NUMBERS, A_NUMBERS,
    CURVES_323, curveMDMT, PARA_323,
    interp, convert, UNITS, getE, getAlpha
  });
})(window);