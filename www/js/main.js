//Router from: https://github.com/flatiron/director
require([ 'js/kontakt.jquery.js'], function(){
	var currentGroup = null;
	
	$(document).ready(function() {

		UWAP.auth.require(init);
		
	});
	
	// Keeps a list of all groups
	var myGroups = new Array();
	
	// Model for groups
	var Group = function(id, title, adminBool, memberBool, ownerBool, listMembersBool, description){
		this.id = id;
		this.title = title;
		if(description){
			this.description = description;	
		}
		this.admin = adminBool;
		this.member = memberBool;
		this.owner = ownerBool;
		this.listmembers = listMembersBool;
		this.members = new Array();
		this.admins = new Array();
		this.owners = new Array();
		this.userlist = new Array();
		this.you;
		this.titleView = $('<h2>'+this.title+'</h2>');
		this.detailsContainer;
		this.groupView;
		this.me;
		this.breaks;
	};
	
	Group.prototype.getId = function(){
		return this.id;
	};
	
	Group.prototype.getName = function(){
		return this.name;
	};
	
	Group.prototype.getDescription = function(){
		return this.description;
	};

	Group.prototype.getMembers = function(){
		return this.members;
	};
	
	Group.prototype.getAdmins = function(){
		return this.admins;
	};
	
	Group.prototype.getOwners = function(){
		return this.owners;
	};
	
	Group.prototype.removeGroup = function(groupView){
		if(confirm("Delete the group?")){
			UWAP.groups.removeGroup(this.id, function(){
				groupView.empty();
				this.breaks.remove();
			}, updateError);
		}
	};
	
	Group.prototype.addMember = function(member){
		var gr = this;
		if(this.members.indexOf(member.userid[0])==-1){
			this.members.push(member.userid[0]);
			this.userlist[member.userid[0]] = {"admin": false, "member": true, "name": member.name[0], "userid": member.userid[0], "mail": member.mail[0] };
			UWAP.groups.addMember(this.id, { "userid": member.userid[0], "name": member.name[0], "jpegphoto": member.jpegphoto[0]}, function(){
				
				gr.membersView();
			}, updateError);
		}
	};
	
	Group.prototype.promoteMember = function(member){
		var gr = this;
		this.admins.push(member);
		
		UWAP.groups.updateMember(this.id, member, {'admin': true}, function(){
			gr.adminsView();
			gr.membersView();
		}, updateError);
	};
	
	Group.prototype.demoteMember = function(admin){
		var gr = this;
		var tempAdmin = this.admins.indexOf(admin);
		if(tempAdmin!=-1) admin = this.admins.splice(tempAdmin, 1);
		
		if(admin == this.me.userid){
			console.log('Remaking editor since user has demoted himself..');
			gr.editView();
		}
		
		UWAP.groups.updateMember(this.id, admin, {'admin': false}, function(){
			gr.adminsView();
			gr.membersView()
		}, updateError);
	};
	
	Group.prototype.removeMember = function(member){
		var gr = this;
		var tempMem = this.members.indexOf(member);
		if(tempMem!=-1) this.members.splice(tempMem, 1);
		delete this.userlist[member];
		var tempAdmin = this.admins.indexOf(member);
		if(tempAdmin!=-1) this.admins.splice(tempAdmin, 1);
		UWAP.groups.removeMember(this.id, member, function(){
			gr.membersView();
			gr.adminsView();
			$("#peoplesearch").keyup();
			if(member == gr.me.userid){
				gr.listView();
				gr.editView();
			}
		}, updateError);
	};
	
	Group.prototype.setDescription = function(newDescription){
		this.description = newDescription;
		var descSpan = this.groupView.find('span').empty().append(newDescription);
		
		UWAP.groups.updateGroup(this.id, {'description' : newDescription}, updateSuccess, updateError);
		
	};
	
	Group.prototype.setName = function(newName){
		this.title = newName;
		this.groupView.find('h3').empty().append(newName);
		UWAP.groups.updateGroup(this.id, {'title': newName}, updateSuccess, updateError);
	};
	
		
	//Adds the group to the list, and handles events.
	Group.prototype.listView = function(){
		var groupView;
		var gr = this;
		var hidden = false;
		
		if(this.description){
			groupView = $('<div class="groupView"><div class="topOfGV"></div><div class="spacerDiv"></div><h3 class="groupMargin">'+this.title+'</h3>'
				+'<span class="groupMargin">'+this.description+'</span><br />'
				+'</div>').appendTo('#myGroups');
		}
		else{
			groupView = $('<div class="groupView"><div class="topOfGV"></div><h3 class="groupMargin">'+this.title+'</h3>'
					+'<span class="groupMargin"></span></div>').appendTo('#myGroups');
		}
		
		
		if(this.admin == false && this.owner == false){
			if(this.listmembers){
				var gr = this;
				$('<a href="#/groups/'+gr.id+'" class="btn btn-success btn-mini groupMargin">Info</a>').click(function(){

				}).appendTo(groupView);
			}
			
		}
		else{
			var gr = this;
			$('<a href="#/groups/'+gr.id+'" class="btn btn-primary btn-mini groupMargin">Edit</a>').click(function(){

			}).appendTo(groupView);
			$('<a href="javascript:void(0)" class="btn btn-danger btn-mini">Delete</a>').click(function(){
				gr.removeGroup(groupView);
			}).appendTo(groupView);
			
		}
		$('<div class="bottomOfGV"></div>').appendTo(groupView);
		var breaks = $('<br /><br /><br /><br />').appendTo('#myGroups');
		this.breaks = breaks;
		this.groupView = groupView;
		
		var search = $('#searchInput').keyup(function(){
			if(gr.description && gr.title.toLowerCase().indexOf(this.value.toLowerCase()) == -1 && gr.description.toLowerCase().indexOf(this.value.toLowerCase()) == -1){
					
				hidden = true;
				groupView.hide('fast');
				breaks.hide();
			}
			else if(!gr.description && gr.title.toLowerCase().indexOf(this.value.toLowerCase()) == -1 ){
				hidden = true;
				groupView.hide('fast');
				breaks.hide();
			}
			else if(hidden){
				hidden = false;
				groupView.show('fast');
				breaks.show();
			}
			
		});
		
	};
	
	//Opens an info/edit-page for the group. 
	Group.prototype.editView = function(){
		var gr = this;
		console.log('editview: ');
		console.log(this);
		var mainContainer = $('#mainContainer').hide();
		 
		$('#detailsContainer').remove();
		var detailsContainer = $('<div id="detailsContainer" class="container span8 offset2" ></div>').appendTo('body');
		var topNav = $('<div class="topNav"></div>').appendTo(detailsContainer);
		$('<a href="#">Groups</a>').appendTo(topNav).click(function(){detailsContainer.remove();mainContainer.show();});
		$('<span> &#62; '+gr.id+'</span>').appendTo(topNav);
//		$().appendTo(topNav);
		
		var detailsContainer2 = $('<div class="container"  style="padding-left:15px; padding-top: 10px;"></div').appendTo(detailsContainer);
		
		var titleContainer = $('<div></div>').appendTo(detailsContainer2); 
		var title = $('<h1>'+this.title+'</h1>').appendTo(titleContainer);	
		if(gr.you.admin || gr.you.owner){
			console.log('is owner or admin');
			$(' <a style="margin-left: 10px;" href="javascript:void(0)" class="btn btn-primary btn-mini"> Edit</a>').appendTo(title).click(function(){
				gr.makeTitleEditor(titleContainer);
			});
		}
		
		var descriptionContainer = $('<div> <h2>Description </h2><span>'+this.description+'</span></div>').appendTo(detailsContainer2);
		if(this.admin || this.owner){
			defaultDescr(descriptionContainer, gr);
		}
		
		var adminsContainer = $('<div id="admins"><div>').appendTo(detailsContainer2);
		gr.adminsView();
		
		
		
		var membersContainer = $('<div id="members"></div>').appendTo(detailsContainer2);
		gr.membersView();
		
		
		if(gr.you.admin || gr.you.owner){
			$('<br /><br /><h2>Add</h2>').appendTo(detailsContainer2);
			var sDiv= $('<div style="border: 1px solid #DDD; width:300px;"></div>').appendTo(detailsContainer2);
			$('<img height="16px" width="16px" src=" img/search.png"/>').appendTo(sDiv);
			var search = $(' <input style="border: none; width:280px" id="peoplesearch" placeholder="Type to search..."/>').appendTo(sDiv);

			var pres = $('<div id="pres"></div>').appendTo(detailsContainer2);
			$("#peoplesearch").on('keyup', function() {
				var q = $("#peoplesearch").val();
				console.log('search: ', q);


				if (q.length < 2) return;

				UWAP.people.query(q, function(data) {
					$("#pres").empty();
					$.each(data, function(i, item) {
						if(item.userid && gr.members.indexOf(item.userid[0])==-1){
							var e = $('<div style="clear: both"></div>');
							if (item.jpegphoto) {
								e.append('<img class="img-polaroid" style="margin: 5px; float: left; max-height:'
										+'64px; border: 1px solid #ccc" src="data:image/jpeg;base64,' 
										+ item.jpegphoto
										+ '" />');
							}
							var iName = $('<h3 style="margin: 0px;">' + item.name + ' </h3>').appendTo(e);

							$("#pres").append(e);

							$(' <button type="button" class="btn btn-success btn-mini">Add</button>').appendTo(iName).click(function(){
								gr.addMember(item);
								e.remove();
							});

							var e2 = '<p><span style="margin-right: 15px;"><i class="icon-briefcase"></i> ' +
							item.o + '</span>';
							e2 += '<span style="margin-right: 15px;"><i class="icon-user"></i> ' +
							item.userid + '</span>';
							e2 += '<span style="margin-right: 15px;"><i class="icon-envelope"></i> ' +
							item.mail + '</span></p>';
							e.append(e2);
						}
						


					});
				});
			});
		}
		
	};
	
	Group.prototype.adminsView = function() {
		var gr = this;
		var tempUser;
		var adminsContainer = $('#admins');
		adminsContainer.empty().append('<br /><br /><h2>Admins</h2>');
		$.each(this.admins, function(i,v){
			if(gr.userlist[v]){
				tempUser = $('<h3>'+gr.userlist[v].name+' </h3>').appendTo(adminsContainer);

				if(gr.you.admin || gr.you.owner){
					$('<a style="margin-left: 10px;" href="javascript:void(0)" class="btn btn-warning btn-mini">Demote</a><br />').appendTo(tempUser).click(function(){
						gr.demoteMember(v);
					});
				}

				$('<span style="margin-right: 15px;"><i class="icon-user"></i> ' +
						gr.userlist[v].userid + '</span>').appendTo(adminsContainer);
				$('<span style="margin-right: 15px;"><i class="icon-envelope"></i> ' +
						gr.userlist[v].mail + '</span></p>').appendTo(adminsContainer);
			}
		});
	};
	
	Group.prototype.membersView = function(){
		var gr = this;
		var tempUser;
		var membersContainer = $('#members');
		
		membersContainer.empty().append('<br /><br /><h2>Regular Members</h2>');
		$.each(this.members, function(i, v){
			if(gr.userlist[v] && gr.admins.indexOf(v) == -1){
				tempUser = $('<h4>'+gr.userlist[v].name+' </h4>').appendTo(membersContainer);
				if(gr.you.admin || gr.you.owner){
					$(' <a style="margin-left: 10px;" href="javascript:void(0)" class="btn btn-danger btn-mini">X</a> ').appendTo(tempUser).click(function(){
						gr.removeMember(v);
					});
					$(' <button height="16px" href="javascript:void(0)" class="btn btn-success btn-mini">Promote</button><br />').appendTo(tempUser).click(function(){
						gr.promoteMember(v);
					});
				}
				
				$('<span style="margin-right: 15px;"><i class="icon-user"></i> ' +
						gr.userlist[v].userid + '</span>').appendTo(membersContainer);
				$('<span style="margin-right: 15px;"><i class="icon-envelope"></i> ' +
						gr.userlist[v].mail + '</span></p>').appendTo(membersContainer);
			}
		});
	};
	
	Group.prototype.makeTitleEditor = function(titleContainer){
		var gr = this;
		titleContainer.empty();
		var editDiv = $('<div></div>').appendTo(titleContainer);
		var title = $('<input style="font-size:20px;" />').appendTo(editDiv).val(gr.title);
		$('<a href="javascript:void(0)" class="btn btn-success">Save</a>').click( function(){
			gr.setName(title.val());
			gr.makeNormalTitle(titleContainer);
		}).appendTo(editDiv);
		
	};
	
	Group.prototype.makeNormalTitle = function(titleContainer){
		var gr = this;
		titleContainer.empty();
		var title = $('<h1>'+this.title+' </h1>').appendTo(titleContainer);	
		if(gr.you.admin || gr.you.owner){
			$('<a style="margin-left: 10px;" href="javascript:void(0)" class="btn btn-primary btn-mini">Edit</a>').appendTo(title).click(function(){
				gr.makeTitleEditor(title);
			});
		}
	};
	
	function defaultDescr(descriptionContainer, gr){
		var editDescr = $('<a style="margin-left: 10px;" href="javascript:void(0)" class="btn btn-primary btn-mini">Edit</a>').appendTo(descriptionContainer).click(function(){
				editDesc(descriptionContainer,gr);
			});
	}
	
	function editDesc(descriptionContainer,gr){
		descriptionContainer.empty();
				$('<h2>Description<h2>').appendTo(descriptionContainer);
				var tArea = $('<textarea width="500">'+gr.description+'</textarea>').appendTo(descriptionContainer);
				var saveButton = $('<a href="javascript:void(0)" class="btn btn-success">Save</a>').appendTo(descriptionContainer).click(function(){
					gr.setDescription(tArea.val());
					tArea.remove();
					saveButton.remove();
					$('<span>'+gr.description+'</span>').appendTo(descriptionContainer);
					defaultDescr(descriptionContainer, gr);
				});
	}
	
	
	function updateSuccess(){
		console.log('Successfully updated.');
	}
	
	function updateError(err){
		console.log('Update error: '+err);
	}
	function findGroupById(id){
		var runAgain = true;
		var i = 0;
		while(runAgain){
			if(myGroups.length>i){
				if(myGroups[i].id == id) {
					return myGroups[i];
				};
			}
			else{
				runAgain = false;
			}
			i++;
		}
	}
	
	function init(u){
		console.log(u); 
		 var  groupHandler = function(id){
			 UWAP.groups.get(id, function(d){
				 console.log(d);
				 if(d==null){
					 return null;
				 }
				 var gr = findGroupById(id);
				 if(gr == undefined){
					
					 if(d.description){
						 gr = new Group(d.id, d.title, d.you.admin, d.you.member, d.you.owner, true, d.description);
					 }
					 else{
						 gr = new Group(d.id, d.title, d.you.admin, d.you.member, d.you.owner, true);
					 }
				 }
				 gr.admins = d.admins;
				 gr.members = d.members;
				 gr.owners.push(d.owner);
				 gr.userlist = d.userlist;
				 gr.you = d.you;
				 currentGroup = gr;
				 gr.editView();
				 gr.me = u;
				 
			 }, function(err){console.log('error getting group: '+err);});};
			 
		var newHandler = function(){
			administerGroup('new');
		};

		//Router from: https://github.com/flatiron/director
		var routes = {
				 '/groups/:id': groupHandler,
				 '/new': newHandler
		 };

		 var router = Router(routes);
		 router.init();
		
		 
		$('#myGroups').html('');
		$('#myOwnGroups').html('');
		UWAP.groups.listMyGroups(function(d){
			if(d){
				$.each(d, function(i, v){
					if(currentGroup != null && currentGroup.id == v.id){
						console.log(v);console.log('Same as currently showing..');
						myGroups.push(currentGroup);
						currentGroup.listView();
						
					}
					else{
						var dGroup;
						if(v.description){
							dGroup = new Group(v.id, v.title, v.admin, v.member, v.owner, v.listmembers, v.description);	
						}
						else{
							dGroup = new Group(v.id, v.title, v.admin, v.member, v.owner, v.listmembers);
						}
						console.log(dGroup);
						myGroups.push(dGroup);
						dGroup.listView();
					}
				});
			}
			
		});
		var search = $('#searchInput').change(function(){console.log('inputChanged')});
		$('#searchCancel').click(function(){search.val(''); search.keyup(); console.log('searchCancelled');});
		search.focus();
		
		$('#addOwnGroup').click(function(){
			administerGroup('new');
		});
	}
	function administerGroup(group){
		if(group=='new'){
			$('.modal-header').html(
					'<button href="#" type="button" class="close" data-dismiss="modal">x</button>'
					+'<h3>Create new group</h3>'
					);
			$('.modal-body').html(
					'Title: <br /><input width="100%" id="newTitle"></input><br /><br />'
					+'Description: <br /><textarea rows="4" style="width:400px;" width="300px" id="newDescription"></textarea><br />'
					+'<div id="memberList"></div>'
			);
			$('.modal-footer').html(
					'<a href="#" class="btn" data-dismiss="modal">Close</a> <a href="#"'
						+' class="btn btn-primary" id="saveChanges">Save changes</a>'
			);
			$('#saveChanges').click(function(){
				UWAP.groups.addGroup({ title: $('#newTitle').prop('value'), description: $('#newDescription').prop('value')},
						function(d){
					var dGroup;
					if(d.description){
						dGroup = new Group(d.id, d.title, d.you.admin, d.you.member, d.you.owner, true, d.description);	
					}
					else{
						dGroup = new Group(d.id, d.title, d.you.admin, d.you.member, d.you.owner, true);
					}
					console.log(dGroup);
					myGroups.push(dGroup);
					dGroup.listView();
				}, errorCatch);
				$('#myModal').modal('toggle');
				
			});
			//$('#addMember').kontakt({ callback: function(member) {memberAdded(group, member);}});
			
			
		}
		$('#myModal').modal('show');
	}
	function errorCatch(err){
		console.log(err);
	}	
});