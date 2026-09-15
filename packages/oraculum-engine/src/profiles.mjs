export const PROFILE_REGISTRY_VERSION = 'HNK-ORACULUM-PROFILES/V1';

export const PROFILE_SOURCES = Object.freeze({
  SY_CORE_V1:Object.freeze({url:'https://www.sefaria.org/Sefer_Yetzirah_Gra_Version.1',note:'Gra Version 1:2 — ten Sefirot, 22 Foundation Letters, 3 Mothers, 7 Doubles, 12 Elementals'}),
  ICHING_KING_WEN_V1:Object.freeze({url:'https://plato.stanford.edu/archives/fall2019/entries/chinese-change/appendix.html',note:'Trigram/hexagram structure and bottom-to-top line convention'}),
  HERMETIC_GD_V1:Object.freeze({url:'https://www.hermetics.org/tarocchi.html',note:'Golden Dawn Tarot/Hebrew/path/astrological attribution table'}),
  TAROT_GD_V1:Object.freeze({url:'https://s3.us-west-1.wasabisys.com/luminist/EB/R/Regardie%20-%20The%20Complete%20Golden%20Dawn.pdf',note:'Book T suit-element attributions'}),
  ASTRO_CLASSICAL_V1:Object.freeze({url:'HNK_PROFILE_INTERNAL',note:'Classical zodiac element triplicities; profile-scoped, not part of raw protocol'})
});

export const ZODIAC_ELEMENTS = Object.freeze({ARIES:'FIRE',TAURUS:'EARTH',GEMINI:'AIR',CANCER:'WATER',LEO:'FIRE',VIRGO:'EARTH',LIBRA:'AIR',SCORPIO:'WATER',SAGITTARIUS:'FIRE',CAPRICORN:'EARTH',AQUARIUS:'AIR',PISCES:'WATER'});
export const TRIGRAM_ARCHETYPES = Object.freeze({QIAN:Object.freeze({image:'HEAVEN'}),DUI:Object.freeze({image:'LAKE'}),LI:Object.freeze({image:'FIRE',element:'FIRE'}),ZHEN:Object.freeze({image:'THUNDER'}),XUN:Object.freeze({image:'WIND'}),KAN:Object.freeze({image:'WATER',element:'WATER'}),GEN:Object.freeze({image:'MOUNTAIN'}),KUN:Object.freeze({image:'EARTH',element:'EARTH'})});
export const KABBALAH_TREE_10 = Object.freeze(['KETER','CHOKHMAH','BINAH','CHESED','GEVURAH','TIFERET','NETZACH','HOD','YESOD','MALKUTH']);

const GD_ROWS = [
['ALEF','MOTHER','FOOL','ELEMENT','AIR'],['BET','DOUBLE','MAGICIAN','PLANET','MERCURY'],['GIMEL','DOUBLE','HIGH_PRIESTESS','PLANET','MOON'],['DALET','DOUBLE','EMPRESS','PLANET','VENUS'],['HEH','SIMPLE','EMPEROR','ZODIAC','ARIES'],['VAV','SIMPLE','HIEROPHANT','ZODIAC','TAURUS'],['ZAYIN','SIMPLE','LOVERS','ZODIAC','GEMINI'],['CHET','SIMPLE','CHARIOT','ZODIAC','CANCER'],['TET','SIMPLE','STRENGTH','ZODIAC','LEO'],['YOD','SIMPLE','HERMIT','ZODIAC','VIRGO'],['KAF','DOUBLE','WHEEL_OF_FORTUNE','PLANET','JUPITER'],['LAMED','SIMPLE','JUSTICE','ZODIAC','LIBRA'],['MEM','MOTHER','HANGED_MAN','ELEMENT','WATER'],['NUN','SIMPLE','DEATH','ZODIAC','SCORPIO'],['SAMEKH','SIMPLE','TEMPERANCE','ZODIAC','SAGITTARIUS'],['AYIN','SIMPLE','DEVIL','ZODIAC','CAPRICORN'],['PEH','DOUBLE','TOWER','PLANET','MARS'],['TZADDI','SIMPLE','STAR','ZODIAC','AQUARIUS'],['QOF','SIMPLE','MOON','ZODIAC','PISCES'],['RESH','DOUBLE','SUN','PLANET','SUN'],['SHIN','MOTHER','JUDGEMENT','ELEMENT','FIRE'],['TAV','DOUBLE','WORLD','PLANET','SATURN']];

export const HERMETIC_GD_PATHS = Object.freeze(GD_ROWS.map((row,index)=>Object.freeze({path:index+11,letter:row[0],letterClass:row[1],tarotIndex:index+1,tarot:row[2],attribution:Object.freeze({kind:row[3],value:row[4]}),derivedElement:row[3]==='ELEMENT'?row[4]:row[3]==='ZODIAC'?ZODIAC_ELEMENTS[row[4]]:null})));
export const TAROT_MINOR_SUITS = Object.freeze([Object.freeze({suit:'WANDS',start:23,end:36,element:'FIRE'}),Object.freeze({suit:'CUPS',start:37,end:50,element:'WATER'}),Object.freeze({suit:'SWORDS',start:51,end:64,element:'AIR'}),Object.freeze({suit:'PENTACLES',start:65,end:78,element:'EARTH'})]);
export const TAROT_RANKS = Object.freeze(['ACE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','PAGE','KNIGHT','QUEEN','KING']);

export const HNK_ORACULUM_PROFILES = Object.freeze({
HNK_ORACULUM_DEFAULT_V1:Object.freeze({status:'HNK_AUTHORED_CANDIDATE',layers:Object.freeze(['SY_CORE_V1','KABBALAH_TREE_V1','ICHING_KING_WEN_V1','HERMETIC_GD_V1','TAROT_GD_V1','ASTRO_CLASSICAL_V1','HNK_ELEMENT_TENSION_V1']),candidateHnkOracleSemantics:false}),
SY_CORE_V1:Object.freeze({authority:'SOURCE_VERIFIED',scope:'10_SEFIROT_22_LETTERS_3_7_12',source:PROFILE_SOURCES.SY_CORE_V1}),
KABBALAH_TREE_V1:Object.freeze({authority:'PROFILE_VERIFIED',scope:'LATER_KABBALAH_NAMED_SEFIROT'}),
ICHING_KING_WEN_V1:Object.freeze({authority:'PROFILE_VERIFIED',scope:'TRIGRAMS_AND_KING_WEN_NUMBERING',source:PROFILE_SOURCES.ICHING_KING_WEN_V1}),
HERMETIC_GD_V1:Object.freeze({authority:'PROFILE_VERIFIED',scope:'HEBREW_TAROT_ASTRO_ATTRIBUTIONS',source:PROFILE_SOURCES.HERMETIC_GD_V1}),
TAROT_GD_V1:Object.freeze({authority:'PROFILE_VERIFIED',scope:'SUIT_ELEMENT_ATTRIBUTIONS',source:PROFILE_SOURCES.TAROT_GD_V1}),
ASTRO_CLASSICAL_V1:Object.freeze({authority:'PROFILE_VERIFIED',scope:'ZODIAC_ELEMENT_TRIPLICITIES',source:PROFILE_SOURCES.ASTRO_CLASSICAL_V1}),
HNK_ELEMENT_TENSION_V1:Object.freeze({authority:'HNK_AUTHORED_CANDIDATE',oppositions:Object.freeze([Object.freeze(['FIRE','WATER']),Object.freeze(['AIR','EARTH'])])})});

export function getOraculumProfile(profileId='HNK_ORACULUM_DEFAULT_V1'){const profile=HNK_ORACULUM_PROFILES[profileId];if(!profile)throw new Error(`Unknown interpretation profile: ${profileId}`);return profile;}
export function getPathDescriptor(pathIndex){if(!Number.isInteger(pathIndex)||pathIndex<1||pathIndex>32)throw new RangeError(`Path index must be 1..32: ${pathIndex}`);if(pathIndex<=10)return Object.freeze({path:pathIndex,type:'SEFIRAH',name:KABBALAH_TREE_10[pathIndex-1],authority:'KABBALAH_TREE_V1'});return Object.freeze({type:'LETTER',...HERMETIC_GD_PATHS[pathIndex-11],authority:'HERMETIC_GD_V1'});}
export function getTarotDescriptor(cardIndex){if(!Number.isInteger(cardIndex)||cardIndex<1||cardIndex>78)throw new RangeError(`Tarot card index must be 1..78: ${cardIndex}`);if(cardIndex<=22)return Object.freeze({kind:'MAJOR',...HERMETIC_GD_PATHS[cardIndex-1],authority:'HERMETIC_GD_V1'});const suit=TAROT_MINOR_SUITS.find(item=>cardIndex>=item.start&&cardIndex<=item.end);const rankIndex=cardIndex-suit.start;return Object.freeze({kind:'MINOR',cardIndex,suit:suit.suit,rank:TAROT_RANKS[rankIndex],element:suit.element,authority:'TAROT_GD_V1'});}
