/**
 * 解析 CoDesign 详细字段设计表格原始数据
 * 筛选"是否显示=√"且"是否可编辑=√"的字段，按设计稿顺序输出
 * 不同步 TAPD，仅输出到控制台和 JSON 文件
 */

var fs = require('fs');
var path = require('path');

// 从 Playwright 提取的原始数据（按 widget ID 排序）
var rawData = [
  // 表头：u292-u305（14列）
  {num:292,text:'序号'},{num:293,text:'主/子表名'},{num:294,text:'表头/表体名称'},
  {num:295,text:'原营销系统字段'},{num:296,text:'显示名称'},{num:297,text:'字段类型'},
  {num:298,text:'参照节点'},{num:299,text:'文本长度'},{num:300,text:'小数位'},
  {num:301,text:'日期格式'},{num:302,text:'是否显示'},{num:303,text:'是否可编辑'},
  {num:304,text:'必填'},{num:305,text:'备注'},

  // === 表头字段行 ===
  // FID
  {num:308,text:'预算政策管理表头'},{num:309,text:'FID'},{num:310,text:'主键'},
  {num:311,text:'字符串'},{num:313,text:'100'},
  {num:316,text:'×'},{num:317,text:'×'},{num:318,text:'√'}, // 显示×,编辑×,必填√

  // POLICYCOMPANY
  {num:322,text:'预算政策管理表头'},{num:323,text:'POLICYCOMPANY'},{num:324,text:'政策公司编码'},
  {num:325,text:'参照选择'},{num:326,text:'客户选择弹窗（内部公司）'},{num:327,text:'50'},
  {num:330,text:'√'},{num:331,text:'√'},{num:332,text:'√'}, // 显示√,编辑√,必填√
  {num:333,text:'过滤客户档案中内部公司为"是"的公司'},

  // BUSINESSDEPARTMENT
  {num:336,text:'预算政策管理表头'},{num:337,text:'BUSINESSDEPARTMENT'},{num:338,text:'事业部'},
  {num:339,text:'参照选择'},{num:340,text:'事业部选择弹窗'},{num:341,text:'50'},
  {num:344,text:'√'},{num:345,text:'√'},{num:346,text:'√'}, // 显示√,编辑√,必填√

  // ORDERDEPARTMENT
  {num:350,text:'预算政策管理表头'},{num:351,text:'ORDERDEPARTMENT'},{num:352,text:'制单部门'},
  {num:353,text:'参照选择'},{num:354,text:'办事处选择弹窗'},{num:355,text:'50'},
  {num:358,text:'√'},{num:359,text:'√'},{num:360,text:'√'}, // 显示√,编辑√,必填√
  {num:361,text:'默认取制单人所属部门'},

  // ORDERDATE
  {num:364,text:'预算政策管理表头'},{num:365,text:'ORDERDATE'},{num:366,text:'制单日期'},
  {num:367,text:'日期'},
  {num:371,text:'YYYY-MM-DD'},
  {num:372,text:'√'},{num:373,text:'√'},{num:374,text:'√'}, // 显示√,编辑√,必填√
  {num:375,text:'默认制单日期为创建当天，可编辑'},

  // ORDERNO
  {num:378,text:'预算政策管理表头'},{num:379,text:'ORDERNO'},{num:380,text:'单据编号'},
  {num:381,text:'字符串'},{num:383,text:'100'},
  {num:386,text:'√'},{num:387,text:'√'},{num:388,text:'√'}, // 显示√,编辑√,必填√
  {num:389,text:'自动生成'},

  // ENTERDATE
  {num:392,text:'预算政策管理表头'},{num:393,text:'ENTERDATE'},{num:394,text:'录入日期'},
  {num:395,text:'日期'},
  {num:400,text:'√'},{num:401,text:'√'},{num:402,text:'×'}, // 显示√,编辑√,必填×
  {num:403,text:'默认制单日期为创建当天，可编辑'},

  // REMARK
  {num:406,text:'预算政策管理表头'},{num:407,text:'REMARK'},{num:408,text:'备注'},
  {num:409,text:'字符串'},{num:411,text:'500'},
  {num:414,text:'√'},{num:415,text:'√'},{num:416,text:'×'}, // 显示√,编辑√,必填×

  // CREATER
  {num:420,text:'预算政策管理表头'},{num:421,text:'CREATER'},{num:422,text:'创建人'},
  {num:423,text:'参照选择'},{num:424,text:'人员账号选择弹窗'},{num:425,text:'100'},
  {num:428,text:'√'},{num:429,text:'×'},{num:430,text:'√'}, // 显示√,编辑×,必填√

  // CREATEDATE
  {num:434,text:'预算政策管理表头'},{num:435,text:'CREATEDATE'},{num:436,text:'创建时间'},
  {num:437,text:'日期'},
  {num:441,text:'YYYY-MM-DD hh:mm:ss'},
  {num:442,text:'√'},{num:443,text:'×'},{num:444,text:'√'}, // 显示√,编辑×,必填√

  // LASTMODIFY
  {num:448,text:'预算政策管理表头'},{num:449,text:'LASTMODIFY'},{num:450,text:'最后修改人'},
  {num:451,text:'参照选择'},{num:452,text:'人员账号选择弹窗'},{num:453,text:'100'},
  {num:456,text:'√'},{num:457,text:'×'},{num:458,text:'×'}, // 显示√,编辑×,必填×

  // LASTMODIFYDATE
  {num:462,text:'预算政策管理表头'},{num:463,text:'LASTMODIFYDATE'},{num:464,text:'最后修改时间'},
  {num:465,text:'日期'},
  {num:469,text:'YYYY-MM-DD hh:mm:ss'},
  {num:470,text:'√'},{num:471,text:'×'},{num:472,text:'×'}, // 显示√,编辑×,必填×

  // STATUS
  {num:476,text:'预算政策管理表头'},{num:477,text:'STATUS'},{num:478,text:'状态'},
  {num:479,text:'字典'},{num:481,text:'100'},
  {num:484,text:'√'},{num:485,text:'×'},{num:486,text:'√'}, // 显示√,编辑×,必填√

  // IMPORT_SIGN
  {num:490,text:'预算政策管理表头'},{num:491,text:'IMPORT_SIGN'},{num:492,text:'导入标志'},
  {num:493,text:'字符串'},{num:494,text:'Y/N'},{num:495,text:'64'},
  {num:498,text:'×'},{num:499,text:'×'},{num:500,text:'×'}, // 显示×,编辑×,必填×
  {num:501,text:'通过导入excel生成的预算政策，导入标志更新为"Y"，否则为"N"'},

  // === 表体字段行 ===
  // FID
  {num:504,text:'预算政策管理表体'},{num:505,text:'FID'},{num:506,text:'主键'},
  {num:507,text:'字符串'},{num:509,text:'100'},
  {num:512,text:'×'},{num:513,text:'×'},{num:514,text:'√'}, // 显示×,编辑×,必填√

  // FPARENTID
  {num:518,text:'预算政策管理表体'},{num:519,text:'FPARENTID'},{num:520,text:'主表FID外键'},
  {num:521,text:'字符串'},{num:523,text:'100'},
  {num:526,text:'×'},{num:527,text:'×'},{num:528,text:'√'}, // 显示×,编辑×,必填√

  // STARTDATE
  {num:532,text:'预算政策管理表体'},{num:533,text:'STARTDATE'},{num:534,text:'开始日期'},
  {num:535,text:'日期'},
  {num:539,text:'YYYY-MM-DD'},
  {num:540,text:'√'},{num:541,text:'√'},{num:542,text:'×'}, // 显示√,编辑√,必填×

  // ENDDATE
  {num:546,text:'预算政策管理表体'},{num:547,text:'ENDDATE'},{num:548,text:'结束日期'},
  {num:549,text:'日期'},
  {num:553,text:'YYYY-MM-DD'},
  {num:554,text:'√'},{num:555,text:'√'},{num:556,text:'√'}, // 显示√,编辑√,必填√

  // ADMINAREA
  {num:560,text:'预算政策管理表体'},{num:561,text:'ADMINAREA'},{num:562,text:'省份'},
  {num:563,text:'参照选择'},{num:564,text:'省份选择弹窗'},
  {num:568,text:'√'},{num:569,text:'√'},{num:570,text:'×'}, // 显示√,编辑√,必填×
  {num:571,text:'参照一级行政区域，即省份'},

  // STAFF
  {num:574,text:'预算政策管理表体'},{num:575,text:'STAFF'},{num:576,text:'账务负责人'},
  {num:577,text:'参照选择'},{num:578,text:'人员选择弹窗'},{num:579,text:'50'},
  {num:582,text:'√'},{num:583,text:'√'},{num:584,text:'×'}, // 显示√,编辑√,必填×

  // STAFF_NCPK
  {num:588,text:'预算政策管理表体'},{num:589,text:'STAFF_NCPK'},{num:590,text:'账务负责人NCpk'},
  {num:591,text:'字符串'},{num:593,text:'100'},
  {num:596,text:'√'},{num:597,text:'√'},{num:598,text:'×'}, // 显示√,编辑√,必填×

  // CREDIT
  {num:602,text:'预算政策管理表体'},{num:603,text:'CREDIT'},{num:604,text:'信用对象'},
  {num:605,text:'参照选择'},{num:606,text:'人员选择弹窗'},{num:607,text:'50'},
  {num:610,text:'×'},{num:611,text:'√'},{num:612,text:'×'}, // 显示×,编辑√,必填×

  // BUSINESSPROVINCE
  {num:616,text:'预算政策管理表体'},{num:617,text:'BUSINESSPROVINCE'},{num:618,text:'业务省份'},
  {num:619,text:'参照选择'},{num:620,text:'省份选择弹窗'},{num:621,text:'50'},
  {num:624,text:'√'},{num:625,text:'√'},{num:626,text:'√'}, // 显示√,编辑√,必填√
  {num:627,text:'参照一级行政区域，即省份'},

  // CONTRACTBUYER
  {num:630,text:'预算政策管理表体'},{num:631,text:'CONTRACTBUYER'},{num:632,text:'合同购方'},
  {num:633,text:'参照选择'},{num:634,text:'客户选择弹窗（全）'},{num:635,text:'50'},
  {num:638,text:'√'},{num:639,text:'√'},{num:640,text:'×'}, // 显示√,编辑√,必填×

  // MATERIEL
  {num:644,text:'预算政策管理表体'},{num:645,text:'MATERIEL'},{num:646,text:'物料'},
  {num:647,text:'参照选择'},{num:648,text:'成药与大健康物料选择弹窗'},{num:649,text:'50'},
  {num:652,text:'√'},{num:653,text:'√'},{num:654,text:'√'}, // 显示√,编辑√,必填√
  {num:655,text:'修改物料，将返回的生产公司名称写入当前行的生产公司字段'},

  // POLICYTYPES
  {num:658,text:'预算政策管理表体'},{num:659,text:'POLICYTYPES'},{num:660,text:'政策类型'},
  {num:661,text:'系统公共参数'},{num:662,text:'policyType 承包费政策类型'},{num:663,text:'100'},
  {num:666,text:'√'},{num:667,text:'√'},{num:668,text:'√'}, // 显示√,编辑√,必填√
  {num:669,text:'默认带出"全国政策"'},

  // 发货单号 (无字段编码)
  {num:672,text:'预算政策管理表体'},{num:674,text:'发货单号'},
  {num:675,text:'字符串'},{num:677,text:'1000'},
  {num:680,text:'√'},{num:681,text:'√'},{num:682,text:'×'}, // 显示√,编辑√,必填×

  // POLICYLEVEL
  {num:686,text:'预算政策管理表体'},{num:687,text:'POLICYLEVEL'},{num:688,text:'政策层级'},
  {num:689,text:'系统公共参数'},{num:690,text:'policyLevel 政策层级'},{num:691,text:'100'},
  {num:694,text:'√'},{num:695,text:'√'},{num:696,text:'√'}, // 显示√,编辑√,必填√

  // POLICYCATEGORY
  {num:700,text:'预算政策管理表体'},{num:701,text:'POLICYCATEGORY'},{num:702,text:'政策分类'},
  {num:703,text:'系统公共参数'},{num:704,text:'policyCategory 政策分类'},{num:705,text:'100'},
  {num:708,text:'√'},{num:709,text:'√'},{num:710,text:'√'}, // 显示√,编辑√,必填√

  // BASEPRICE
  {num:714,text:'预算政策管理表体'},{num:715,text:'BASEPRICE'},{num:716,text:'最低销售价'},
  {num:717,text:'数值'},{num:720,text:'3'},
  {num:722,text:'√'},{num:723,text:'√'},{num:724,text:'√'}, // 显示√,编辑√,必填√

  // TAXFORMULA
  {num:728,text:'预算政策管理表体'},{num:729,text:'TAXFORMULA'},{num:730,text:'计费公式'},
  {num:731,text:'系统公共参数'},{num:732,text:'accountFormula (承包费政策管理)计费公式'},
  {num:736,text:'√'},{num:737,text:'√'},{num:738,text:'√'}, // 显示√,编辑√,必填√

  // BASEPRICEMODE
  {num:742,text:'预算政策管理表体'},{num:743,text:'BASEPRICEMODE'},{num:744,text:'底价方式'},
  {num:745,text:'系统公共参数'},{num:746,text:'basePriceMode 低价方式'},
  {num:750,text:'×'},{num:751,text:'×'},{num:752,text:'√'}, // 显示×,编辑×,必填√
  {num:753,text:'默认1底价'},

  // RATIO
  {num:756,text:'预算政策管理表体'},{num:757,text:'RATIO'},{num:758,text:'比例'},
  {num:759,text:'数值'},{num:762,text:'2'},
  {num:764,text:'×'},{num:765,text:'×'},{num:766,text:'×'}, // 显示×,编辑×,必填×
  {num:767,text:'底价方式=比例时必填'},

  // BILLINGTAXRATE
  {num:770,text:'预算政策管理表体'},{num:771,text:'BILLINGTAXRATE'},{num:772,text:'计费税率'},
  {num:773,text:'数值'},{num:776,text:'2'},
  {num:778,text:'√'},{num:779,text:'√'},{num:780,text:'√'}, // 显示√,编辑√,必填√

  // FIN_CTRL_WAY
  {num:784,text:'预算政策管理表体'},{num:785,text:'FIN_CTRL_WAY'},{num:786,text:'财务管控额度方式'},
  {num:787,text:'系统公共参数'},{num:788,text:'financialControlWay 财务管控额度方式'},{num:789,text:'100'},
  {num:792,text:'√'},{num:793,text:'√'},{num:794,text:'√'}, // 显示√,编辑√,必填√

  // FIN_CTRL_ITEM
  {num:798,text:'预算政策管理表体'},{num:799,text:'FIN_CTRL_ITEM'},{num:800,text:'财务管控辅助项目'},
  {num:801,text:'系统公共参数'},{num:802,text:'financialControlPro 财务管控辅助项目'},{num:803,text:'100'},
  {num:806,text:'√'},{num:807,text:'√'},{num:808,text:'√'}, // 显示√,编辑√,必填√

  // TICKETFLOOR
  {num:812,text:'预算政策管理表体'},{num:813,text:'TICKETFLOOR'},{num:814,text:'开票价下限'},
  {num:815,text:'数值'},{num:818,text:'3'},
  {num:820,text:'√'},{num:821,text:'√'},{num:822,text:'√'}, // 显示√,编辑√,必填√

  // TICKETUPPER
  {num:826,text:'预算政策管理表体'},{num:827,text:'TICKETUPPER'},{num:828,text:'开票价上限'},
  {num:829,text:'数值'},{num:832,text:'3'},
  {num:834,text:'√'},{num:835,text:'√'},{num:836,text:'√'}, // 显示√,编辑√,必填√

  // COMPANYBALANCEFLOOR
  {num:840,text:'预算政策管理表体'},{num:841,text:'COMPANYBALANCEFLOOR'},{num:842,text:'公司结算底价/参考价（管理部门结算价）'},
  {num:843,text:'数值'},{num:846,text:'2'},
  {num:848,text:'×'},{num:849,text:'√'},{num:850,text:'×'}, // 显示×,编辑√,必填×
  {num:851,text:'预留字段，无逻辑'},

  // REFERENCE_PRICE1
  {num:854,text:'预算政策管理表体'},{num:855,text:'REFERENCE_PRICE1'},{num:856,text:'参考价1'},
  {num:857,text:'数值'},{num:860,text:'2'},
  {num:862,text:'×'},{num:863,text:'√'},{num:864,text:'×'}, // 显示×,编辑√,必填×
  {num:865,text:'预留字段，无逻辑'},

  // REFERENCE_PRICE2
  {num:868,text:'预算政策管理表体'},{num:869,text:'REFERENCE_PRICE2'},{num:870,text:'参考价2'},
  {num:871,text:'数值'},{num:874,text:'2'},
  {num:876,text:'×'},{num:877,text:'√'},{num:878,text:'×'}, // 显示×,编辑√,必填×
  {num:879,text:'预留字段，无逻辑'},

  // REFERENCE_PRICE3
  {num:882,text:'预算政策管理表体'},{num:883,text:'REFERENCE_PRICE3'},{num:884,text:'参考价3'},
  {num:885,text:'数值'},{num:888,text:'2'},
  {num:890,text:'×'},{num:891,text:'√'},{num:892,text:'×'}, // 显示×,编辑√,必填×
  {num:893,text:'预留字段，无逻辑'},

  // PRODUCTCOM
  {num:896,text:'预算政策管理表体'},{num:897,text:'PRODUCTCOM'},{num:898,text:'生产公司'},
  {num:899,text:'参照选择'},{num:900,text:'客户选择弹窗（内部公司）'},{num:901,text:'100'},
  {num:904,text:'√'},{num:905,text:'×'},{num:906,text:'√'}, // 显示√,编辑×,必填√
  {num:907,text:'修改物料，将返回的生产公司名称写入当前行的生产公司字段'},

  // POLICYBASIS (无是否显示/编辑/必填标记)
  {num:910,text:'预算政策管理表体'},{num:911,text:'POLICYBASIS'},{num:912,text:'政策依据'},
  {num:913,text:'字符串'},{num:915,text:'300'},

  // REMARKS (无是否显示/编辑/必填标记)
  {num:924,text:'预算政策管理表体'},{num:925,text:'REMARKS'},{num:926,text:'备注'},
  {num:927,text:'字符串'},{num:929,text:'300'},

  // IMPORT_SIGN (表体)
  {num:938,text:'预算政策管理表体'},{num:939,text:'IMPORT_SIGN'},{num:940,text:'导入标志'},
  {num:941,text:'字典'},{num:942,text:'Y/N'},{num:943,text:'64'},
  {num:949,text:'通过导入excel生成的预算政策，导入标志更新为"Y"，否则为"N"'},
];

// 按行解析（每行14列：表名,字段编码,显示名称,字段类型,参照节点,文本长度,小数位,日期格式,是否显示,是否可编辑,必填,备注）
// 实际每行的列数不固定（有些列空），需要根据√/×标记的位置推断

// 手动解析每行字段
var fields = [
  // 表头
  {table:'表头',code:'FID',name:'主键',type:'字符串',ref:'',len:'100',isShow:false,isEdit:false,isRequired:true,remark:''},
  {table:'表头',code:'POLICYCOMPANY',name:'政策公司编码',type:'参照选择',ref:'客户选择弹窗（内部公司）',len:'50',isShow:true,isEdit:true,isRequired:true,remark:'过滤客户档案中内部公司为"是"的公司'},
  {table:'表头',code:'BUSINESSDEPARTMENT',name:'事业部',type:'参照选择',ref:'事业部选择弹窗',len:'50',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表头',code:'ORDERDEPARTMENT',name:'制单部门',type:'参照选择',ref:'办事处选择弹窗',len:'50',isShow:true,isEdit:true,isRequired:true,remark:'默认取制单人所属部门'},
  {table:'表头',code:'ORDERDATE',name:'制单日期',type:'日期',ref:'',dateFormat:'YYYY-MM-DD',isShow:true,isEdit:true,isRequired:true,remark:'默认制单日期为创建当天，可编辑'},
  {table:'表头',code:'ORDERNO',name:'单据编号',type:'字符串',ref:'',len:'100',isShow:true,isEdit:true,isRequired:true,remark:'自动生成'},
  {table:'表头',code:'ENTERDATE',name:'录入日期',type:'日期',ref:'',dateFormat:'YYYY-MM-DD',isShow:true,isEdit:true,isRequired:false,remark:'默认制单日期为创建当天，可编辑'},
  {table:'表头',code:'REMARK',name:'备注',type:'字符串',ref:'',len:'500',isShow:true,isEdit:true,isRequired:false,remark:''},
  {table:'表头',code:'CREATER',name:'创建人',type:'参照选择',ref:'人员账号选择弹窗',len:'100',isShow:true,isEdit:false,isRequired:true,remark:''},
  {table:'表头',code:'CREATEDATE',name:'创建时间',type:'日期',ref:'',dateFormat:'YYYY-MM-DD hh:mm:ss',isShow:true,isEdit:false,isRequired:true,remark:''},
  {table:'表头',code:'LASTMODIFY',name:'最后修改人',type:'参照选择',ref:'人员账号选择弹窗',len:'100',isShow:true,isEdit:false,isRequired:false,remark:''},
  {table:'表头',code:'LASTMODIFYDATE',name:'最后修改时间',type:'日期',ref:'',dateFormat:'YYYY-MM-DD hh:mm:ss',isShow:true,isEdit:false,isRequired:false,remark:''},
  {table:'表头',code:'STATUS',name:'状态',type:'字典',ref:'',len:'100',isShow:true,isEdit:false,isRequired:true,remark:''},
  {table:'表头',code:'IMPORT_SIGN',name:'导入标志',type:'字符串',ref:'Y/N',len:'64',isShow:false,isEdit:false,isRequired:false,remark:'通过导入excel生成的预算政策，导入标志更新为"Y"，否则为"N"'},

  // 表体
  {table:'表体',code:'FID',name:'主键',type:'字符串',ref:'',len:'100',isShow:false,isEdit:false,isRequired:true,remark:''},
  {table:'表体',code:'FPARENTID',name:'主表FID外键',type:'字符串',ref:'',len:'100',isShow:false,isEdit:false,isRequired:true,remark:''},
  {table:'表体',code:'STARTDATE',name:'开始日期',type:'日期',ref:'',dateFormat:'YYYY-MM-DD',isShow:true,isEdit:true,isRequired:false,remark:''},
  {table:'表体',code:'ENDDATE',name:'结束日期',type:'日期',ref:'',dateFormat:'YYYY-MM-DD',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'ADMINAREA',name:'省份',type:'参照选择',ref:'省份选择弹窗',len:'',isShow:true,isEdit:true,isRequired:false,remark:'参照一级行政区域，即省份'},
  {table:'表体',code:'STAFF',name:'账务负责人',type:'参照选择',ref:'人员选择弹窗',len:'50',isShow:true,isEdit:true,isRequired:false,remark:''},
  {table:'表体',code:'STAFF_NCPK',name:'账务负责人NCpk',type:'字符串',ref:'',len:'100',isShow:true,isEdit:true,isRequired:false,remark:''},
  {table:'表体',code:'CREDIT',name:'信用对象',type:'参照选择',ref:'人员选择弹窗',len:'50',isShow:false,isEdit:true,isRequired:false,remark:''},
  {table:'表体',code:'BUSINESSPROVINCE',name:'业务省份',type:'参照选择',ref:'省份选择弹窗',len:'50',isShow:true,isEdit:true,isRequired:true,remark:'参照一级行政区域，即省份'},
  {table:'表体',code:'CONTRACTBUYER',name:'合同购方',type:'参照选择',ref:'客户选择弹窗（全）',len:'50',isShow:true,isEdit:true,isRequired:false,remark:''},
  {table:'表体',code:'MATERIEL',name:'物料',type:'参照选择',ref:'成药与大健康物料选择弹窗',len:'50',isShow:true,isEdit:true,isRequired:true,remark:'修改物料，将返回的生产公司名称写入当前行的生产公司字段'},
  {table:'表体',code:'POLICYTYPES',name:'政策类型',type:'系统公共参数',ref:'policyType 承包费政策类型',len:'100',isShow:true,isEdit:true,isRequired:true,remark:'默认带出"全国政策"'},
  {table:'表体',code:'DELIVERYNO',name:'发货单号',type:'字符串',ref:'',len:'1000',isShow:true,isEdit:true,isRequired:false,remark:''},
  {table:'表体',code:'POLICYLEVEL',name:'政策层级',type:'系统公共参数',ref:'policyLevel 政策层级',len:'100',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'POLICYCATEGORY',name:'政策分类',type:'系统公共参数',ref:'policyCategory 政策分类',len:'100',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'BASEPRICE',name:'最低销售价',type:'数值',ref:'',decimalPlaces:'3',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'TAXFORMULA',name:'计费公式',type:'系统公共参数',ref:'accountFormula (承包费政策管理)计费公式',len:'',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'BASEPRICEMODE',name:'底价方式',type:'系统公共参数',ref:'basePriceMode 低价方式',len:'',isShow:false,isEdit:false,isRequired:true,remark:'默认1底价'},
  {table:'表体',code:'RATIO',name:'比例',type:'数值',ref:'',decimalPlaces:'2',isShow:false,isEdit:false,isRequired:false,remark:'底价方式=比例时必填'},
  {table:'表体',code:'BILLINGTAXRATE',name:'计费税率',type:'数值',ref:'',decimalPlaces:'2',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'FIN_CTRL_WAY',name:'财务管控额度方式',type:'系统公共参数',ref:'financialControlWay 财务管控额度方式',len:'100',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'FIN_CTRL_ITEM',name:'财务管控辅助项目',type:'系统公共参数',ref:'financialControlPro 财务管控辅助项目',len:'100',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'TICKETFLOOR',name:'开票价下限',type:'数值',ref:'',decimalPlaces:'3',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'TICKETUPPER',name:'开票价上限',type:'数值',ref:'',decimalPlaces:'3',isShow:true,isEdit:true,isRequired:true,remark:''},
  {table:'表体',code:'COMPANYBALANCEFLOOR',name:'公司结算底价/参考价（管理部门结算价）',type:'数值',ref:'',decimalPlaces:'2',isShow:false,isEdit:true,isRequired:false,remark:'预留字段，无逻辑'},
  {table:'表体',code:'REFERENCE_PRICE1',name:'参考价1',type:'数值',ref:'',decimalPlaces:'2',isShow:false,isEdit:true,isRequired:false,remark:'预留字段，无逻辑'},
  {table:'表体',code:'REFERENCE_PRICE2',name:'参考价2',type:'数值',ref:'',decimalPlaces:'2',isShow:false,isEdit:true,isRequired:false,remark:'预留字段，无逻辑'},
  {table:'表体',code:'REFERENCE_PRICE3',name:'参考价3',type:'数值',ref:'',decimalPlaces:'2',isShow:false,isEdit:true,isRequired:false,remark:'预留字段，无逻辑'},
  {table:'表体',code:'PRODUCTCOM',name:'生产公司',type:'参照选择',ref:'客户选择弹窗（内部公司）',len:'100',isShow:true,isEdit:false,isRequired:true,remark:'修改物料，将返回的生产公司名称写入当前行的生产公司字段'},
  {table:'表体',code:'POLICYBASIS',name:'政策依据',type:'字符串',ref:'',len:'300',isShow:false,isEdit:false,isRequired:false,remark:''},
  {table:'表体',code:'REMARKS',name:'备注',type:'字符串',ref:'',len:'300',isShow:false,isEdit:false,isRequired:false,remark:''},
  {table:'表体',code:'IMPORT_SIGN',name:'导入标志',type:'字典',ref:'Y/N',len:'64',isShow:false,isEdit:false,isRequired:false,remark:'通过导入excel生成的预算政策，导入标志更新为"Y"，否则为"N"'},
];

// 筛选"是否显示=√"且"是否可编辑=√"的字段
var filtered = fields.filter(function(f) { return f.isShow && f.isEdit; });

// 按设计稿顺序输出
console.log('=== 详细字段设计：是否显示=√ 且 是否可编辑=√ 的字段 ===');
console.log('总字段数: ' + fields.length);
console.log('筛选后: ' + filtered.length + ' 个（表头 ' + filtered.filter(function(f){return f.table==='表头'}).length + ' + 表体 ' + filtered.filter(function(f){return f.table==='表体'}).length + '）');
console.log('');

console.log('--- 表头字段 ---');
filtered.filter(function(f) { return f.table === '表头'; }).forEach(function(f, i) {
  var req = f.isRequired ? '*' : '';
  var len = f.len ? f.len + '字符' : (f.decimalPlaces ? f.decimalPlaces + '位小数' : (f.dateFormat || ''));
  console.log('  ' + (i+1) + '. ' + req + f.name + ' | ' + f.code + ' | ' + f.type + ' | ' + (f.ref || '-') + ' | ' + len + ' | ' + (f.isRequired ? '必填' : '非必填') + ' | ' + (f.remark || '-'));
});

console.log('');
console.log('--- 表体字段 ---');
filtered.filter(function(f) { return f.table === '表体'; }).forEach(function(f, i) {
  var req = f.isRequired ? '*' : '';
  var len = f.len ? f.len + '字符' : (f.decimalPlaces ? f.decimalPlaces + '位小数' : (f.dateFormat || ''));
  console.log('  ' + (i+1) + '. ' + req + f.name + ' | ' + f.code + ' | ' + f.type + ' | ' + (f.ref || '-') + ' | ' + len + ' | ' + (f.isRequired ? '必填' : '非必填') + ' | ' + (f.remark || '-'));
});

// 保存到 JSON
var outPath = path.join(__dirname, 'budget_policy_fields.json');
fs.writeFileSync(outPath, JSON.stringify({ allFields: fields, filteredFields: filtered }, null, 2), 'utf-8');
console.log('\n已保存: ' + outPath);
