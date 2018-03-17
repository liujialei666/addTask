$(function () {
    var $addTask=$(".addTask").find("form");
    var task_list={};
    init();
    /*为提交内容增加新的Task*/
    $addTask.on("submit",function(e) {
        var new_task={};
        e.preventDefault();
        new_task.content=$(this).find("input[name=thisval]").val();
        if(!new_task.content)
            return;
        if(add_task(new_task))
        {
            $(this).find("input[name=thisval]").val("");
        }
    })
    /*点击删除删除其中的一条任务*/
    $(".task-list").on("click","#delete",function(){
        var a=$(this).parents(".task-item").attr("data-index");
        pop("是否确认删除任务")
            .then(function (r) {
              r ?deleteTask(a):null;
            });
    })
    /*点击显示可以显示出该任务的详情*/
    $(".task-list").on("click","#detail",function () {
       var b=$(this).parents(".task-item").attr("data-index");
        update_mask_detail(b);
        show_task();
    })
    $(".task-list").on("click",".wancheng",function () {
        var thisIndex=$(this).parents(".task-item").attr("data-index");
        if(store.get("task_list")[thisIndex].compeleteData)
        {
            updatecurrentMask(thisIndex,{compeleteData:false});
        }
        else {
            updatecurrentMask(thisIndex, {compeleteData: true});
        }
    })
    $(".task-list").on("dblclick",".task-item",function () {
        var d=$(this).attr("data-index");
        update_mask_detail(d);
        show_task();
    })
    $(".task-mask").on("click",function () {
       hide_mask();
    })
    /*更新新的详情数据并更新模板*/
    function updatecurrentMask(index,newdata) {
        if(!index||!task_list[index])
            return;
        task_list[index]=$.extend({},task_list[index],newdata);
        refresh_taskList();
    }
    /*删除其中的一条任务并更新模板*/
    function deleteTask(c) {
        if(!c||!task_list[c])
            return;
        task_list.splice([c],1);
        refresh_taskList();
    }
    /*在存放数据中加入新增数据*/
    function add_task(newtask) {
        task_list.push(newtask);
        refresh_taskList();
        return true;
    }
    /*实时得到数据库中的数据并更新*/
    function init() {
        task_list=store.get("task_list")||[];
        $(".remindmessage .remindcontent").on("click",function () {
            $("#audio")[0].pause();
            $(".remindmessage").hide();
        })
            update_datetime();
    }
    function pop(conf){
        var contentdata={};
        var $mask;
        var $remind;
        var comfirmed;
        var dfd=$.Deferred();
        if(typeof conf =="string")
        {
            contentdata.title=conf;
        }
        else {
            contentdata=$.extend(contentdata,conf);
        }
        $remind=$("<div>" +
                "<div class='popTile'>"+ contentdata.title+"</div>"+
                "<div class='confirmcontent'>"+
                    "<button class='taskconfirm'>确认</button><button class='canle'>取消</button>" +
                "</div>"
            +"</div>").css({
            width:400,
            height:200,
            background:"#fff",
            position:"absolute",
            color:"#000",
            "border-radius":5,
            "box-shadow":'0 1px 2px'
        }
        )
        $remind.find(".confirmcontent").css({
            "text-align":"center"
        })
        $remind.find(".popTile").css({
            padding:"40px 5px",
            "text-align":"center"
        })
        $remind.find(".confirmcontent button").css({
            background:"#007fff",
            padding:"10px 20px",
            border:0,
            margin:"0 10px",
            "border-radius":5,
            outline:0,
            color:"#fff"
        })
        $mask=$("<div class='confirmMask'></div>").css({
            position:"fixed",
            left:0,
            right:0,
            top:0,
            bottom:0,
            background:"rgba(2,2,2,.5)"
        })
        $mask.appendTo($("body"));
        $remind.appendTo($("body"));
        adjustposition();
        function adjustposition() {
            var $windowwidth=$(window).width();
            var $windowheight=$(window).height();
            var $remindwidth=$remind.width();
            var $remindheight=$remind.height();
            var move_x=($windowwidth-$remindwidth)/2;
            var move_y=($windowheight-$remindheight)/3;
            $remind.css({
                    left:move_x,
                    top:move_y
                }
            )
        }
        function deletePop() {
            $mask.remove();
            $remind.remove();
        }
        var timer1=setInterval(function () {
            if(comfirmed!==undefined)
            {
                dfd.resolve(comfirmed);
                clearInterval(timer1);
                deletePop();
            }
        },50)
        $(".confirmcontent .taskconfirm").on("click",function () {
            comfirmed=true;
        })
        $(".confirmcontent .canle").on("click",function () {
            comfirmed=false;
        })
        $(".confirmMask").on("dblclick",function () {
            deletePop();
        })
        $(window).on("resize",function () {
            adjustposition();
        })
        return dfd.promise();
    }
    function update_datetime() {
        var currentnowtime;
        var datetimer=setInterval(function () {
            for(var a=0;a<task_list.length;a++)
            {
                if(!task_list[a]||!task_list[a].date||task_list[a].timedate)
                    continue;
                var settime=(new Date(task_list[a].date)).getTime();
                currentnowtime=(new Date()).getTime();
                if(currentnowtime-settime>=1)
                {
                    updatecurrentMask(a,{timedate:true});
                    remindme(task_list[a].content);
                }
            }
        },500)
    }
    function remindme(content) {
        var $remindmsg=$(".remindmessage");
        var $remindTitle=$(".remindmessage .remindtitle");
        $remindTitle.html(content);
        $remindmsg.show();
        $("#audio")[0].play();
    }
    function update_mask_detail(itemNumber) {
        var task_item_value=task_list[itemNumber].content;
        var detail_tpl=
            '<form>'+
                '<div class="task-content">'+
                    task_item_value+
                '</div>'+
                '<div >'+
                    '<input style="display:none" value="'+(task_item_value||'')+'" name="content" type="text">'+
                '</div>'+
                '<div class="task-dec">'+
                    '<textarea name="info" id="" cols="30" rows="10">'+(task_list[itemNumber].info||'')+'</textarea>'+
                '</div>'+
                '<div class="remind">'+
                    '<input class="currentdatetime" name="datetime" type="text" value="'+(task_list[itemNumber].date||'')+'">'+
                    '<button type="submit">更新</button>'+
                '</div>'+
             '</form>'
        $(".task-detail").html(detail_tpl);
        $(".currentdatetime").datetimepicker();
        /*双击详情的标题显示input标签，隐藏标题*/
        $(".task-detail").find(".task-content").on("dblclick",function() {
            $(".task-detail").find(".task-content").hide();
            $(".task-detail").find("input[type=text]").show();
        })
        /*点击更新按钮获得新的详情数据并调用更新数据的方法*/
        $(".task-detail").find("form").on("submit",function (event) {
            event.preventDefault();
            var newcurrentData={};
            newcurrentData.content=$(this).find('[name=content]').val();
            newcurrentData.info=$(this).find('[name=info]').val();
            newcurrentData.date=$(this).find('[name=datetime]').val();
            updatecurrentMask(itemNumber,newcurrentData);
            hide_mask();
        })
    }
    function show_task() {
        $(".task-mask").show();
        $(".task-detail").show();
    }
    function hide_mask() {
        $(".task-mask").hide();
        $(".task-detail").hide();
    }
    /*在localstorage存放新的数据*/
    function refresh_taskList() {
        store.set("task_list",task_list);
        render_task_list();
    }
    /*重新刷新新增的任务列表*/
    function render_task_list() {
        var $task_list=$(".task-list");
        var compelete_data=[];
        $task_list.html("");
        for(var i=0;i<task_list.length;i++)
        {
            if(task_list[i]&&task_list[i].compeleteData)
            {
                var $task = render_task_tpl(task_list[i], i);
                $task_list.append($task);
                $task.toggleClass("compelete");
            }
            else {
                var $task = render_task_tpl(task_list[i], i);
                $task_list.prepend($task);
            }
        }
    }
    /*新增每条任务的模板*/
    function render_task_tpl(data,index) {
        if(!data||!index)return;
        var render_task_tpl=
            '<div class="task-item" data-index="' + index + '">'+
            '<span><input type="checkbox" class="wancheng" '+(data.compeleteData?'checked':'')+'></span>'+
            '<span class="item-content">'+data.content+'</span>'+
             '<span class="fr">'+
                '<span class="anchor" id="delete"> 删除</span>'+
                '<span class="anchor" id="detail"> 详细</span>'
            +'</span>'+
            '</div>';
        return $(render_task_tpl);

    }
})
