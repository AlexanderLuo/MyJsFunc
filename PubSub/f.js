/**
 * Created by luohao on 2016/10/12.
 */
var pubsub = (function(){
    var q = {}
    topics = {},
        subUid = -1;
    //������Ϣ
    q.publish = function(topic, args) {
        if(!topics[topic]) {return;}
        var subs = topics[topic],
            len = subs.length;
        while(len--) {
            subs[len].func(topic, args);
        }
        return this;
    };
    //�����¼�
    q.subscribe = function(topic, func) {
        topics[topic] = topics[topic] ? topics[topic] : [];
        var token = (++subUid).toString();
        topics[topic].push({
            token : token,
            func : func
        });
        return token;
    };
    return q;
    //ȡ�����ľͲ�д�ˣ�����topics��Ȼ��ͨ������ǰ�淵��token��ɾ��ָ��Ԫ��
})();

//�������¼�
var logmsg = function(topics, data) {
    console.log("logging:" + topics + ":" + data);
}
//����ָ������Ϣ'msgName'
var sub = pubsub.subscribe('msgName', logmsg);
//������Ϣ'msgName'
pubsub.publish('msgName', 'hello world');
//�������˼�������Ϣ'msgName1'
pubsub.publish('anotherMsgName', 'me too!');

