/**
 * Created by luohao on 2016/10/17.
 */


//获取url地址栏参数
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null)return unescape(r[2]);
    return null;
}






var regTool={
    isPhone:function(str){
        var ph=/^1[34578]\d{9}$/;
        return ph.test(str)
    },
    isIdCard:function(str){
        //15 或者 18 位数字
        var id15=/^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$/;
        var id18=/^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/;
        var out=id15.test(str) || id18.test(str);
        return out;
    },
    isEmail:function(str){

        var em=/^([\w-_]+(?:\.[\w-_]+)*)@((?:[a-z0-9]+(?:-[a-zA-Z0-9]+)*)+\.[a-z]{2,6})$/i;
        return em.test(str)
    }


}
