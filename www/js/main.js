
require(['js/lib/router.jquery.js', 'js/kontakt.jquery.js'], function(){
	var tempMemArr = new Array();
	var tempMembers = {};
	var tempAdmins = new Array();
	$(document).ready(function() {

		UWAP.auth.require(init);
		
	});
	function init(){
		$('#myGroups').html('');
		$('#myOwnGroups').html('');
		UWAP.groups.listMyGroups(function(d){
			if(d){
				$.each(d, listMyGroup);
				$('.myGroup').click(function(ev){
					UWAP.groups.get(this.id, viewGroupDetails, errorCatch);
				});
			}
			
			});
		UWAP.groups.listMyOwnGroups(function(d){
			if(d){
				$.each(d, listMyOwnGroup);
				$('.myOwnGroup').click(function(ev){
					console.log(this.id.split("own"));
					console.log(this.id);
					UWAP.groups.get(this.id.split("own")[1], administerGroup, errorCatch);
				});
			}
		});
		$('#addOwnGroup').click(function(){
			administerGroup('new');
		});
	}
	function listMyGroup(i, group){
		var memString = ' members';
		console.log(group.members);
		if(group.members.length == 1){
			memString = ' member';
		}
		$('#myGroups').append('<a class="myGroup" data-toggle="modal" id="'+group.id+'" href="javascript:void(0)">'+group.title+'</a> ('
				+group.members.length+memString+')'
				+' <br />'
				+group.description+'<br /><br />');
	}
	function removeGroup(group){
		UWAP.groups.removeGroup(group.id, function() {}, errorCatch);
	}
	function cloneGroup(group){
		$('.modal-header').html(
				'<button type="button" class="close" data-dismiss="modal">x</button>'
				+'<h3>Create new group</h3>'
				);
		$('.modal-body').html(
				'Title: <br /><input width="100%" id="newTitle"></input><br /><br />'
				+'Description: <br /><input width="100%" id="newDescription"></input>'
		);
		$('.modal-footer').html(
				'<a href="#" class="btn" data-dismiss="modal">Close</a> <a href="#"'
					+'class="btn btn-primary" id="saveChanges">Save changes</a>'
		);
		$('#saveChanges').click(function(){
			UWAP.groups.addGroup({ title: $('#newTitle').prop('value'), description: $('#newDescription').prop('value')},
					function(){}, errorCatch);
		});
		$('#newTitle').prop('value', group.title);
		$('#newDescription').prop('value', group.description);
		$('#myModal').modal('show');
	}
	function listMyOwnGroup(i, group){
		var memString = ' members';
		if(group.members.length == 1){
			memString = ' member';
		}
		$('#myOwnGroups').append('<a class="myOwnGroup" id="own'+group.id+'" href="javascript:void(0)">'+group.title+'</a> ('
				+group.members.length+memString+')'
				+' <a href="javascript:void(0)" id="rem'+group.id+'">- delete</a><br />'
//				+' <a href="javascript:void(0)" id="clone'+group.id+'">- add clone</a>'
				);
		$('#rem'+group.id).click(function(){
			removeGroup(group);
			init();
		});
//		$('#clone'+group.id).click(function(){
//			cloneGroup(group);
//		});
	}
	function viewGroupDetails(group){
		var adminHTML = '';
		$.each(group.admins, function(i, admin){
			adminHTML+='<p>'+admin+'</p>';
		});
		$('.modal-header').html(
				'<button type="button" class="close" data-dismiss="modal">×</button>'
					+'<h3>'+group.title+' details</h3>'
		);
		$('.modal-body').html(
				'<p>'+group.description+'</p>'
//				+'<input id="addMember" placeholder="Add member"></input><br />'
				+'<div id="memberList"> <b>Members:</b> '//+ memHTML
				
				+ '</div>'
				+'<div id="adminList"><b>Admins:</b> '+ adminHTML +'</p>'
				//+'Add admin: <br /><input id="addAdmin"></input><br />'
				+'<p> <b>ID:</b> '+group.id+'</p>'
				+'<p><b>Owner:</b> '+group['uwap-userid']+'</p>'
		);
		$('.modal-footer').html('<a href="#" class="btn" data-dismiss="modal">Close</a>');
		$('#addMember').kontakt({ callback: function(member) {memberAdded(group, member);}});
		$('#addAdmin').kontakt({ callback: function(member) {adminAdded(group, member);}});
		$.each(group.members, function(i, member){
			$('#memberList').append('<p>'+group.userlist[member].name+' ('+group.userlist[member].userid+')</p>')
//			.find('p')
//			.last()
//			.append('<a class="removeUser" id="rem'+group.userlist[member].userid+'" href="javascript:void(0)">remove</a>')
//			.find('a')
//			.last()
//			.click(function(){
//				console.log($(this).parent());
//				$(this).parent().remove();
//				UWAP.groups.removeMember(group.id, this.id.split('rem')[1], function(){}, errorCatch);
//			});
			
		});
		$('#myModal').modal('show');
	}
	function administerGroup(group){
		if(group=='new'){
			$('.modal-header').html(
					'<button type="button" class="close" data-dismiss="modal">x</button>'
					+'<h3>Create new group</h3>'
					);
			$('.modal-body').html(
					'Title: <br /><input width="100%" id="newTitle"></input><br /><br />'
					+'Description: <br /><input width="100%" id="newDescription"></input><br />'
//					+'Add member: <br /><input id="addMember"></input><br />'
					+'<div id="memberList"></div>'
			);
			$('.modal-footer').html(
					'<a href="#" class="btn" data-dismiss="modal">Close</a> <a href="#"'
						+'class="btn btn-primary" id="saveChanges">Save changes</a>'
			);
			$('#saveChanges').click(function(){
				UWAP.groups.addGroup({ title: $('#newTitle').prop('value'), description: $('#newDescription').prop('value')},
						function(){}, errorCatch);
				init();
				$('#myModal').modal('toggle');
				
//				$.each(tempMemArr, function(i, mem){
//					UWAP.groups.addMember(group.id, mem);
//				});
//				tempMemArr = new Array();
//				tempMembers = {};
//				tempAdmins = new Array();
//				init();
			});
			$('#addMember').kontakt({ callback: function(member) {memberAdded(group, member);}});
			
			
		}
		else{
//			console.log(group);
//			var memHTML = '';
			var adminHTML = '';
//			$.each(group.members, function(i, member){
//						memHTML+='<p id="'+group.userlist[member].userid+'">'+group.userlist[member].name+' ('+group.userlist[member].userid+') - <a href="javascript:void(0)" id="rem'+group.userlist[member].userid+'" class="removeUser">remove</a></p>';
//			});
			$.each(group.admins, function(i, admin){
				adminHTML+='<p>'+admin+'</p>';
			});
			$('.modal-header').html(
					'<button type="button" class="close" data-dismiss="modal">×</button>'
						+'<h3>'+group.title+' admin</h3>'
			);
			$('.modal-body').html(
					'<p>'+group.description+'</p>'
					+'<input id="addMember" placeholder="Add member"></input><br />'
					+'<div id="memberList"> <b>Members:</b> '//+ memHTML
					
					+ '</div>'
					+'<div id="adminList"><b>Admins:</b> '+ adminHTML +'</p>'
					//+'Add admin: <br /><input id="addAdmin"></input><br />'
					+'<p> <b>ID:</b> '+group.id+'</p>'
					+'<p><b>Owner:</b> '+group['uwap-userid']+'</p>'
			);
			$('.modal-footer').html('<a href="#" class="btn" data-dismiss="modal">Close</a>');
			$('#addMember').kontakt({ callback: function(member) {memberAdded(group, member);}});
			$('#addAdmin').kontakt({ callback: function(member) {adminAdded(group, member);}});
			$.each(group.members, function(i, member){
				$('#memberList').append('<p>'+group.userlist[member].name+' ('+group.userlist[member].userid+') - </p>')
				.find('p')
				.last()
				.append('<a class="removeUser" id="rem'+group.userlist[member].userid+'" href="javascript:void(0)">remove</a>')
				.find('a')
				.last()
				.click(function(){
					console.log($(this).parent());
					$(this).parent().remove();
					UWAP.groups.removeMember(group.id, this.id.split('rem')[1], function(){}, errorCatch);
				});
				
			});
		}
		$('#myModal').modal('show');
	}
	function listMember(i, member){
		
	}
	function adminAdded(group, member){
		if(group == 'new'){
			
			adminMembers.push(member.userid);
		}
		else{
			
		}
		$('#adminList').append('<p>'+member.name+' ('+member.mail+')</p>')
	}
	function memberAdded(group, member){
		console.log(group);
		if(group == 'new'){
			tempMemArr.push(member);
			tempMembers[member.userid] = member;
		}
		else{
			UWAP.groups.addMember(group.id, member, function(){console.log('added user');}, errorCatch);
			
		}
		$('#memberList').append('<p>'+member.name+' ('+member.userid+') - </p>')
		.find('p')
		.last()
		.append('<a class="removeUser" id="rem'+member.userid+'" href="javascript:void(0)">remove</a>')
		.find('a')
		.last()
		.click(function(){
			console.log($(this).parent());
			$(this).parent().remove();
			UWAP.groups.removeMember(group.id, this.id.split('rem')[1], function(){}, errorCatch);
		});
	}
	function errorCatch(err){
		console.log(err);
	}	
});