/**
 * Static registry of all 257 ISO-3166-1 alpha-2 flag SVGs from
 * `country-flag-icons` (3x2 aspect ratio) — subdivision/special flags with
 * hyphenated codes (e.g. `BQ-BO`) are excluded since they are not valid
 * region codes and are not valid JS identifiers either.
 *
 * Generated once from the package's `3x2/` directory listing — Metro cannot
 * resolve a dynamic `require(\`.../${code}.svg\`)`, so every flag has to be
 * imported statically up front and looked up by key at runtime instead.
 *
 * Regenerate the same way if `country-flag-icons` bumps and changes its
 * country set.
 */
import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

import Flag_AC from 'country-flag-icons/3x2/AC.svg';
import Flag_AD from 'country-flag-icons/3x2/AD.svg';
import Flag_AE from 'country-flag-icons/3x2/AE.svg';
import Flag_AF from 'country-flag-icons/3x2/AF.svg';
import Flag_AG from 'country-flag-icons/3x2/AG.svg';
import Flag_AI from 'country-flag-icons/3x2/AI.svg';
import Flag_AL from 'country-flag-icons/3x2/AL.svg';
import Flag_AM from 'country-flag-icons/3x2/AM.svg';
import Flag_AO from 'country-flag-icons/3x2/AO.svg';
import Flag_AQ from 'country-flag-icons/3x2/AQ.svg';
import Flag_AR from 'country-flag-icons/3x2/AR.svg';
import Flag_AS from 'country-flag-icons/3x2/AS.svg';
import Flag_AT from 'country-flag-icons/3x2/AT.svg';
import Flag_AU from 'country-flag-icons/3x2/AU.svg';
import Flag_AW from 'country-flag-icons/3x2/AW.svg';
import Flag_AX from 'country-flag-icons/3x2/AX.svg';
import Flag_AZ from 'country-flag-icons/3x2/AZ.svg';
import Flag_BA from 'country-flag-icons/3x2/BA.svg';
import Flag_BB from 'country-flag-icons/3x2/BB.svg';
import Flag_BD from 'country-flag-icons/3x2/BD.svg';
import Flag_BE from 'country-flag-icons/3x2/BE.svg';
import Flag_BF from 'country-flag-icons/3x2/BF.svg';
import Flag_BG from 'country-flag-icons/3x2/BG.svg';
import Flag_BH from 'country-flag-icons/3x2/BH.svg';
import Flag_BI from 'country-flag-icons/3x2/BI.svg';
import Flag_BJ from 'country-flag-icons/3x2/BJ.svg';
import Flag_BL from 'country-flag-icons/3x2/BL.svg';
import Flag_BM from 'country-flag-icons/3x2/BM.svg';
import Flag_BN from 'country-flag-icons/3x2/BN.svg';
import Flag_BO from 'country-flag-icons/3x2/BO.svg';
import Flag_BQ from 'country-flag-icons/3x2/BQ.svg';
import Flag_BR from 'country-flag-icons/3x2/BR.svg';
import Flag_BS from 'country-flag-icons/3x2/BS.svg';
import Flag_BT from 'country-flag-icons/3x2/BT.svg';
import Flag_BV from 'country-flag-icons/3x2/BV.svg';
import Flag_BW from 'country-flag-icons/3x2/BW.svg';
import Flag_BY from 'country-flag-icons/3x2/BY.svg';
import Flag_BZ from 'country-flag-icons/3x2/BZ.svg';
import Flag_CA from 'country-flag-icons/3x2/CA.svg';
import Flag_CC from 'country-flag-icons/3x2/CC.svg';
import Flag_CD from 'country-flag-icons/3x2/CD.svg';
import Flag_CF from 'country-flag-icons/3x2/CF.svg';
import Flag_CG from 'country-flag-icons/3x2/CG.svg';
import Flag_CH from 'country-flag-icons/3x2/CH.svg';
import Flag_CI from 'country-flag-icons/3x2/CI.svg';
import Flag_CK from 'country-flag-icons/3x2/CK.svg';
import Flag_CL from 'country-flag-icons/3x2/CL.svg';
import Flag_CM from 'country-flag-icons/3x2/CM.svg';
import Flag_CN from 'country-flag-icons/3x2/CN.svg';
import Flag_CO from 'country-flag-icons/3x2/CO.svg';
import Flag_CR from 'country-flag-icons/3x2/CR.svg';
import Flag_CU from 'country-flag-icons/3x2/CU.svg';
import Flag_CV from 'country-flag-icons/3x2/CV.svg';
import Flag_CW from 'country-flag-icons/3x2/CW.svg';
import Flag_CX from 'country-flag-icons/3x2/CX.svg';
import Flag_CY from 'country-flag-icons/3x2/CY.svg';
import Flag_CZ from 'country-flag-icons/3x2/CZ.svg';
import Flag_DE from 'country-flag-icons/3x2/DE.svg';
import Flag_DJ from 'country-flag-icons/3x2/DJ.svg';
import Flag_DK from 'country-flag-icons/3x2/DK.svg';
import Flag_DM from 'country-flag-icons/3x2/DM.svg';
import Flag_DO from 'country-flag-icons/3x2/DO.svg';
import Flag_DZ from 'country-flag-icons/3x2/DZ.svg';
import Flag_EC from 'country-flag-icons/3x2/EC.svg';
import Flag_EE from 'country-flag-icons/3x2/EE.svg';
import Flag_EG from 'country-flag-icons/3x2/EG.svg';
import Flag_EH from 'country-flag-icons/3x2/EH.svg';
import Flag_ER from 'country-flag-icons/3x2/ER.svg';
import Flag_ES from 'country-flag-icons/3x2/ES.svg';
import Flag_ET from 'country-flag-icons/3x2/ET.svg';
import Flag_EU from 'country-flag-icons/3x2/EU.svg';
import Flag_FI from 'country-flag-icons/3x2/FI.svg';
import Flag_FJ from 'country-flag-icons/3x2/FJ.svg';
import Flag_FK from 'country-flag-icons/3x2/FK.svg';
import Flag_FM from 'country-flag-icons/3x2/FM.svg';
import Flag_FO from 'country-flag-icons/3x2/FO.svg';
import Flag_FR from 'country-flag-icons/3x2/FR.svg';
import Flag_GA from 'country-flag-icons/3x2/GA.svg';
import Flag_GB from 'country-flag-icons/3x2/GB.svg';
import Flag_GD from 'country-flag-icons/3x2/GD.svg';
import Flag_GE from 'country-flag-icons/3x2/GE.svg';
import Flag_GF from 'country-flag-icons/3x2/GF.svg';
import Flag_GG from 'country-flag-icons/3x2/GG.svg';
import Flag_GH from 'country-flag-icons/3x2/GH.svg';
import Flag_GI from 'country-flag-icons/3x2/GI.svg';
import Flag_GL from 'country-flag-icons/3x2/GL.svg';
import Flag_GM from 'country-flag-icons/3x2/GM.svg';
import Flag_GN from 'country-flag-icons/3x2/GN.svg';
import Flag_GP from 'country-flag-icons/3x2/GP.svg';
import Flag_GQ from 'country-flag-icons/3x2/GQ.svg';
import Flag_GR from 'country-flag-icons/3x2/GR.svg';
import Flag_GS from 'country-flag-icons/3x2/GS.svg';
import Flag_GT from 'country-flag-icons/3x2/GT.svg';
import Flag_GU from 'country-flag-icons/3x2/GU.svg';
import Flag_GW from 'country-flag-icons/3x2/GW.svg';
import Flag_GY from 'country-flag-icons/3x2/GY.svg';
import Flag_HK from 'country-flag-icons/3x2/HK.svg';
import Flag_HM from 'country-flag-icons/3x2/HM.svg';
import Flag_HN from 'country-flag-icons/3x2/HN.svg';
import Flag_HR from 'country-flag-icons/3x2/HR.svg';
import Flag_HT from 'country-flag-icons/3x2/HT.svg';
import Flag_HU from 'country-flag-icons/3x2/HU.svg';
import Flag_IC from 'country-flag-icons/3x2/IC.svg';
import Flag_ID from 'country-flag-icons/3x2/ID.svg';
import Flag_IE from 'country-flag-icons/3x2/IE.svg';
import Flag_IL from 'country-flag-icons/3x2/IL.svg';
import Flag_IM from 'country-flag-icons/3x2/IM.svg';
import Flag_IN from 'country-flag-icons/3x2/IN.svg';
import Flag_IO from 'country-flag-icons/3x2/IO.svg';
import Flag_IQ from 'country-flag-icons/3x2/IQ.svg';
import Flag_IR from 'country-flag-icons/3x2/IR.svg';
import Flag_IS from 'country-flag-icons/3x2/IS.svg';
import Flag_IT from 'country-flag-icons/3x2/IT.svg';
import Flag_JE from 'country-flag-icons/3x2/JE.svg';
import Flag_JM from 'country-flag-icons/3x2/JM.svg';
import Flag_JO from 'country-flag-icons/3x2/JO.svg';
import Flag_JP from 'country-flag-icons/3x2/JP.svg';
import Flag_KE from 'country-flag-icons/3x2/KE.svg';
import Flag_KG from 'country-flag-icons/3x2/KG.svg';
import Flag_KH from 'country-flag-icons/3x2/KH.svg';
import Flag_KI from 'country-flag-icons/3x2/KI.svg';
import Flag_KM from 'country-flag-icons/3x2/KM.svg';
import Flag_KN from 'country-flag-icons/3x2/KN.svg';
import Flag_KP from 'country-flag-icons/3x2/KP.svg';
import Flag_KR from 'country-flag-icons/3x2/KR.svg';
import Flag_KW from 'country-flag-icons/3x2/KW.svg';
import Flag_KY from 'country-flag-icons/3x2/KY.svg';
import Flag_KZ from 'country-flag-icons/3x2/KZ.svg';
import Flag_LA from 'country-flag-icons/3x2/LA.svg';
import Flag_LB from 'country-flag-icons/3x2/LB.svg';
import Flag_LC from 'country-flag-icons/3x2/LC.svg';
import Flag_LI from 'country-flag-icons/3x2/LI.svg';
import Flag_LK from 'country-flag-icons/3x2/LK.svg';
import Flag_LR from 'country-flag-icons/3x2/LR.svg';
import Flag_LS from 'country-flag-icons/3x2/LS.svg';
import Flag_LT from 'country-flag-icons/3x2/LT.svg';
import Flag_LU from 'country-flag-icons/3x2/LU.svg';
import Flag_LV from 'country-flag-icons/3x2/LV.svg';
import Flag_LY from 'country-flag-icons/3x2/LY.svg';
import Flag_MA from 'country-flag-icons/3x2/MA.svg';
import Flag_MC from 'country-flag-icons/3x2/MC.svg';
import Flag_MD from 'country-flag-icons/3x2/MD.svg';
import Flag_ME from 'country-flag-icons/3x2/ME.svg';
import Flag_MF from 'country-flag-icons/3x2/MF.svg';
import Flag_MG from 'country-flag-icons/3x2/MG.svg';
import Flag_MH from 'country-flag-icons/3x2/MH.svg';
import Flag_MK from 'country-flag-icons/3x2/MK.svg';
import Flag_ML from 'country-flag-icons/3x2/ML.svg';
import Flag_MM from 'country-flag-icons/3x2/MM.svg';
import Flag_MN from 'country-flag-icons/3x2/MN.svg';
import Flag_MO from 'country-flag-icons/3x2/MO.svg';
import Flag_MP from 'country-flag-icons/3x2/MP.svg';
import Flag_MQ from 'country-flag-icons/3x2/MQ.svg';
import Flag_MR from 'country-flag-icons/3x2/MR.svg';
import Flag_MS from 'country-flag-icons/3x2/MS.svg';
import Flag_MT from 'country-flag-icons/3x2/MT.svg';
import Flag_MU from 'country-flag-icons/3x2/MU.svg';
import Flag_MV from 'country-flag-icons/3x2/MV.svg';
import Flag_MW from 'country-flag-icons/3x2/MW.svg';
import Flag_MX from 'country-flag-icons/3x2/MX.svg';
import Flag_MY from 'country-flag-icons/3x2/MY.svg';
import Flag_MZ from 'country-flag-icons/3x2/MZ.svg';
import Flag_NA from 'country-flag-icons/3x2/NA.svg';
import Flag_NC from 'country-flag-icons/3x2/NC.svg';
import Flag_NE from 'country-flag-icons/3x2/NE.svg';
import Flag_NF from 'country-flag-icons/3x2/NF.svg';
import Flag_NG from 'country-flag-icons/3x2/NG.svg';
import Flag_NI from 'country-flag-icons/3x2/NI.svg';
import Flag_NL from 'country-flag-icons/3x2/NL.svg';
import Flag_NO from 'country-flag-icons/3x2/NO.svg';
import Flag_NP from 'country-flag-icons/3x2/NP.svg';
import Flag_NR from 'country-flag-icons/3x2/NR.svg';
import Flag_NU from 'country-flag-icons/3x2/NU.svg';
import Flag_NZ from 'country-flag-icons/3x2/NZ.svg';
import Flag_OM from 'country-flag-icons/3x2/OM.svg';
import Flag_PA from 'country-flag-icons/3x2/PA.svg';
import Flag_PE from 'country-flag-icons/3x2/PE.svg';
import Flag_PF from 'country-flag-icons/3x2/PF.svg';
import Flag_PG from 'country-flag-icons/3x2/PG.svg';
import Flag_PH from 'country-flag-icons/3x2/PH.svg';
import Flag_PK from 'country-flag-icons/3x2/PK.svg';
import Flag_PL from 'country-flag-icons/3x2/PL.svg';
import Flag_PM from 'country-flag-icons/3x2/PM.svg';
import Flag_PN from 'country-flag-icons/3x2/PN.svg';
import Flag_PR from 'country-flag-icons/3x2/PR.svg';
import Flag_PS from 'country-flag-icons/3x2/PS.svg';
import Flag_PT from 'country-flag-icons/3x2/PT.svg';
import Flag_PW from 'country-flag-icons/3x2/PW.svg';
import Flag_PY from 'country-flag-icons/3x2/PY.svg';
import Flag_QA from 'country-flag-icons/3x2/QA.svg';
import Flag_RE from 'country-flag-icons/3x2/RE.svg';
import Flag_RO from 'country-flag-icons/3x2/RO.svg';
import Flag_RS from 'country-flag-icons/3x2/RS.svg';
import Flag_RU from 'country-flag-icons/3x2/RU.svg';
import Flag_RW from 'country-flag-icons/3x2/RW.svg';
import Flag_SA from 'country-flag-icons/3x2/SA.svg';
import Flag_SB from 'country-flag-icons/3x2/SB.svg';
import Flag_SC from 'country-flag-icons/3x2/SC.svg';
import Flag_SD from 'country-flag-icons/3x2/SD.svg';
import Flag_SE from 'country-flag-icons/3x2/SE.svg';
import Flag_SG from 'country-flag-icons/3x2/SG.svg';
import Flag_SH from 'country-flag-icons/3x2/SH.svg';
import Flag_SI from 'country-flag-icons/3x2/SI.svg';
import Flag_SJ from 'country-flag-icons/3x2/SJ.svg';
import Flag_SK from 'country-flag-icons/3x2/SK.svg';
import Flag_SL from 'country-flag-icons/3x2/SL.svg';
import Flag_SM from 'country-flag-icons/3x2/SM.svg';
import Flag_SN from 'country-flag-icons/3x2/SN.svg';
import Flag_SO from 'country-flag-icons/3x2/SO.svg';
import Flag_SR from 'country-flag-icons/3x2/SR.svg';
import Flag_SS from 'country-flag-icons/3x2/SS.svg';
import Flag_ST from 'country-flag-icons/3x2/ST.svg';
import Flag_SV from 'country-flag-icons/3x2/SV.svg';
import Flag_SX from 'country-flag-icons/3x2/SX.svg';
import Flag_SY from 'country-flag-icons/3x2/SY.svg';
import Flag_SZ from 'country-flag-icons/3x2/SZ.svg';
import Flag_TA from 'country-flag-icons/3x2/TA.svg';
import Flag_TC from 'country-flag-icons/3x2/TC.svg';
import Flag_TD from 'country-flag-icons/3x2/TD.svg';
import Flag_TF from 'country-flag-icons/3x2/TF.svg';
import Flag_TG from 'country-flag-icons/3x2/TG.svg';
import Flag_TH from 'country-flag-icons/3x2/TH.svg';
import Flag_TJ from 'country-flag-icons/3x2/TJ.svg';
import Flag_TK from 'country-flag-icons/3x2/TK.svg';
import Flag_TL from 'country-flag-icons/3x2/TL.svg';
import Flag_TM from 'country-flag-icons/3x2/TM.svg';
import Flag_TN from 'country-flag-icons/3x2/TN.svg';
import Flag_TO from 'country-flag-icons/3x2/TO.svg';
import Flag_TR from 'country-flag-icons/3x2/TR.svg';
import Flag_TT from 'country-flag-icons/3x2/TT.svg';
import Flag_TV from 'country-flag-icons/3x2/TV.svg';
import Flag_TW from 'country-flag-icons/3x2/TW.svg';
import Flag_TZ from 'country-flag-icons/3x2/TZ.svg';
import Flag_UA from 'country-flag-icons/3x2/UA.svg';
import Flag_UG from 'country-flag-icons/3x2/UG.svg';
import Flag_UM from 'country-flag-icons/3x2/UM.svg';
import Flag_US from 'country-flag-icons/3x2/US.svg';
import Flag_UY from 'country-flag-icons/3x2/UY.svg';
import Flag_UZ from 'country-flag-icons/3x2/UZ.svg';
import Flag_VA from 'country-flag-icons/3x2/VA.svg';
import Flag_VC from 'country-flag-icons/3x2/VC.svg';
import Flag_VE from 'country-flag-icons/3x2/VE.svg';
import Flag_VG from 'country-flag-icons/3x2/VG.svg';
import Flag_VI from 'country-flag-icons/3x2/VI.svg';
import Flag_VN from 'country-flag-icons/3x2/VN.svg';
import Flag_VU from 'country-flag-icons/3x2/VU.svg';
import Flag_WF from 'country-flag-icons/3x2/WF.svg';
import Flag_WS from 'country-flag-icons/3x2/WS.svg';
import Flag_XA from 'country-flag-icons/3x2/XA.svg';
import Flag_XC from 'country-flag-icons/3x2/XC.svg';
import Flag_XK from 'country-flag-icons/3x2/XK.svg';
import Flag_XO from 'country-flag-icons/3x2/XO.svg';
import Flag_YE from 'country-flag-icons/3x2/YE.svg';
import Flag_YT from 'country-flag-icons/3x2/YT.svg';
import Flag_ZA from 'country-flag-icons/3x2/ZA.svg';
import Flag_ZM from 'country-flag-icons/3x2/ZM.svg';
import Flag_ZW from 'country-flag-icons/3x2/ZW.svg';

export const FLAG_COMPONENTS: Record<string, ComponentType<SvgProps>> = {
  AC: Flag_AC,
  AD: Flag_AD,
  AE: Flag_AE,
  AF: Flag_AF,
  AG: Flag_AG,
  AI: Flag_AI,
  AL: Flag_AL,
  AM: Flag_AM,
  AO: Flag_AO,
  AQ: Flag_AQ,
  AR: Flag_AR,
  AS: Flag_AS,
  AT: Flag_AT,
  AU: Flag_AU,
  AW: Flag_AW,
  AX: Flag_AX,
  AZ: Flag_AZ,
  BA: Flag_BA,
  BB: Flag_BB,
  BD: Flag_BD,
  BE: Flag_BE,
  BF: Flag_BF,
  BG: Flag_BG,
  BH: Flag_BH,
  BI: Flag_BI,
  BJ: Flag_BJ,
  BL: Flag_BL,
  BM: Flag_BM,
  BN: Flag_BN,
  BO: Flag_BO,
  BQ: Flag_BQ,
  BR: Flag_BR,
  BS: Flag_BS,
  BT: Flag_BT,
  BV: Flag_BV,
  BW: Flag_BW,
  BY: Flag_BY,
  BZ: Flag_BZ,
  CA: Flag_CA,
  CC: Flag_CC,
  CD: Flag_CD,
  CF: Flag_CF,
  CG: Flag_CG,
  CH: Flag_CH,
  CI: Flag_CI,
  CK: Flag_CK,
  CL: Flag_CL,
  CM: Flag_CM,
  CN: Flag_CN,
  CO: Flag_CO,
  CR: Flag_CR,
  CU: Flag_CU,
  CV: Flag_CV,
  CW: Flag_CW,
  CX: Flag_CX,
  CY: Flag_CY,
  CZ: Flag_CZ,
  DE: Flag_DE,
  DJ: Flag_DJ,
  DK: Flag_DK,
  DM: Flag_DM,
  DO: Flag_DO,
  DZ: Flag_DZ,
  EC: Flag_EC,
  EE: Flag_EE,
  EG: Flag_EG,
  EH: Flag_EH,
  ER: Flag_ER,
  ES: Flag_ES,
  ET: Flag_ET,
  EU: Flag_EU,
  FI: Flag_FI,
  FJ: Flag_FJ,
  FK: Flag_FK,
  FM: Flag_FM,
  FO: Flag_FO,
  FR: Flag_FR,
  GA: Flag_GA,
  GB: Flag_GB,
  GD: Flag_GD,
  GE: Flag_GE,
  GF: Flag_GF,
  GG: Flag_GG,
  GH: Flag_GH,
  GI: Flag_GI,
  GL: Flag_GL,
  GM: Flag_GM,
  GN: Flag_GN,
  GP: Flag_GP,
  GQ: Flag_GQ,
  GR: Flag_GR,
  GS: Flag_GS,
  GT: Flag_GT,
  GU: Flag_GU,
  GW: Flag_GW,
  GY: Flag_GY,
  HK: Flag_HK,
  HM: Flag_HM,
  HN: Flag_HN,
  HR: Flag_HR,
  HT: Flag_HT,
  HU: Flag_HU,
  IC: Flag_IC,
  ID: Flag_ID,
  IE: Flag_IE,
  IL: Flag_IL,
  IM: Flag_IM,
  IN: Flag_IN,
  IO: Flag_IO,
  IQ: Flag_IQ,
  IR: Flag_IR,
  IS: Flag_IS,
  IT: Flag_IT,
  JE: Flag_JE,
  JM: Flag_JM,
  JO: Flag_JO,
  JP: Flag_JP,
  KE: Flag_KE,
  KG: Flag_KG,
  KH: Flag_KH,
  KI: Flag_KI,
  KM: Flag_KM,
  KN: Flag_KN,
  KP: Flag_KP,
  KR: Flag_KR,
  KW: Flag_KW,
  KY: Flag_KY,
  KZ: Flag_KZ,
  LA: Flag_LA,
  LB: Flag_LB,
  LC: Flag_LC,
  LI: Flag_LI,
  LK: Flag_LK,
  LR: Flag_LR,
  LS: Flag_LS,
  LT: Flag_LT,
  LU: Flag_LU,
  LV: Flag_LV,
  LY: Flag_LY,
  MA: Flag_MA,
  MC: Flag_MC,
  MD: Flag_MD,
  ME: Flag_ME,
  MF: Flag_MF,
  MG: Flag_MG,
  MH: Flag_MH,
  MK: Flag_MK,
  ML: Flag_ML,
  MM: Flag_MM,
  MN: Flag_MN,
  MO: Flag_MO,
  MP: Flag_MP,
  MQ: Flag_MQ,
  MR: Flag_MR,
  MS: Flag_MS,
  MT: Flag_MT,
  MU: Flag_MU,
  MV: Flag_MV,
  MW: Flag_MW,
  MX: Flag_MX,
  MY: Flag_MY,
  MZ: Flag_MZ,
  NA: Flag_NA,
  NC: Flag_NC,
  NE: Flag_NE,
  NF: Flag_NF,
  NG: Flag_NG,
  NI: Flag_NI,
  NL: Flag_NL,
  NO: Flag_NO,
  NP: Flag_NP,
  NR: Flag_NR,
  NU: Flag_NU,
  NZ: Flag_NZ,
  OM: Flag_OM,
  PA: Flag_PA,
  PE: Flag_PE,
  PF: Flag_PF,
  PG: Flag_PG,
  PH: Flag_PH,
  PK: Flag_PK,
  PL: Flag_PL,
  PM: Flag_PM,
  PN: Flag_PN,
  PR: Flag_PR,
  PS: Flag_PS,
  PT: Flag_PT,
  PW: Flag_PW,
  PY: Flag_PY,
  QA: Flag_QA,
  RE: Flag_RE,
  RO: Flag_RO,
  RS: Flag_RS,
  RU: Flag_RU,
  RW: Flag_RW,
  SA: Flag_SA,
  SB: Flag_SB,
  SC: Flag_SC,
  SD: Flag_SD,
  SE: Flag_SE,
  SG: Flag_SG,
  SH: Flag_SH,
  SI: Flag_SI,
  SJ: Flag_SJ,
  SK: Flag_SK,
  SL: Flag_SL,
  SM: Flag_SM,
  SN: Flag_SN,
  SO: Flag_SO,
  SR: Flag_SR,
  SS: Flag_SS,
  ST: Flag_ST,
  SV: Flag_SV,
  SX: Flag_SX,
  SY: Flag_SY,
  SZ: Flag_SZ,
  TA: Flag_TA,
  TC: Flag_TC,
  TD: Flag_TD,
  TF: Flag_TF,
  TG: Flag_TG,
  TH: Flag_TH,
  TJ: Flag_TJ,
  TK: Flag_TK,
  TL: Flag_TL,
  TM: Flag_TM,
  TN: Flag_TN,
  TO: Flag_TO,
  TR: Flag_TR,
  TT: Flag_TT,
  TV: Flag_TV,
  TW: Flag_TW,
  TZ: Flag_TZ,
  UA: Flag_UA,
  UG: Flag_UG,
  UM: Flag_UM,
  US: Flag_US,
  UY: Flag_UY,
  UZ: Flag_UZ,
  VA: Flag_VA,
  VC: Flag_VC,
  VE: Flag_VE,
  VG: Flag_VG,
  VI: Flag_VI,
  VN: Flag_VN,
  VU: Flag_VU,
  WF: Flag_WF,
  WS: Flag_WS,
  XA: Flag_XA,
  XC: Flag_XC,
  XK: Flag_XK,
  XO: Flag_XO,
  YE: Flag_YE,
  YT: Flag_YT,
  ZA: Flag_ZA,
  ZM: Flag_ZM,
  ZW: Flag_ZW,
};
