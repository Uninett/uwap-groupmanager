//Router from: https://github.com/flatiron/director
define(function(require, exports, module) {

	var 
		$ = require('jquery'),
		hogan = require('uwap-core/js/hogan'),
		UWAP = require('uwap-core/js/core');
	
	//require("lib/jsrender");
	require("lib/director");
	require("uwap-core/js/uwap-people");
	require('uwap-core/bootstrap/js/bootstrap');	
	require('uwap-core/bootstrap/js/bootstrap-collapse');
	require('uwap-core/bootstrap/js/bootstrap-modal');
	require('uwap-core/bootstrap/js/bootstrap-typeahead');
	require('uwap-core/bootstrap/js/bootstrap-button');
	
	var tmpl = {
		    "detCont": require('uwap-core/js/text!templates/detailsContainer.html'),
		    "allMembers": require('uwap-core/js/text!templates/allMembers.html'),
		    "allMembersNormal":  require('uwap-core/js/text!templates/allMembersNormal.html'),
		    "createGroupModal": require('uwap-core/js/text!templates/createGroupModal.html'),
		    "listGroup": require('uwap-core/js/text!templates/listGroup.html')
	};
	
	var currentGroup = null;
	
	$(document).ready(function() {

		UWAP.auth.require(init);
		
	});
	
	// Keeps a list of all groups
	var myGroups = new Array();
	var otherTemplates = {
			"createGroupModal": hogan.compile(tmpl.createGroupModal)
	};
	
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
		this.listable;
		
		this.templates = {
			"detCont": hogan.compile(tmpl.detCont),
			"allMembers": hogan.compile(tmpl.allMembers),
			"allMembersNormal": hogan.compile(tmpl.allMembersNormal),
			"listGroup": hogan.compile(tmpl.listGroup)
		};
	};
	
	Group.prototype.removeGroup = function(groupView, breaks){
		if(confirm("Delete the group?")){
			UWAP.groups.removeGroup(this.id, function(){
				groupView.empty();
				breaks.remove();
			}, updateError);
		}
	};
	
	Group.prototype.setListing = function(bool){
		this.listable = bool;
		UWAP.groups.updateGroup(this.id, {'listable' : bool}, updateSuccess, updateError);
		
	};
	
	Group.prototype.addMember = function(member){
		var gr = this;
		if(this.members.indexOf(member.userid[0])==-1){
			var memObj = { "userid": member.userid[0] }
			if(member.name[0]){
				memObj.name = member.name[0];
			}
			if(member.mail[0]){
				memObj.mail = member.mail[0];
			}
			UWAP.groups.addMember(this.id, memObj, function(){
				
				gr.members.push(member.userid[0]);
				gr.userlist[member.userid[0]] = {"admin": false, "member": true, "name": member.name[0], "userid": member.userid[0], "mail": member.mail[0] };
				gr.allMembersView();
			}, function(err){
				alert(err);
			});
		}
	};
	
	Group.prototype.promoteMember = function(member){
		var gr = this;
		this.admins.push(member);
		this.userlist[member].admin = true;
		UWAP.groups.updateMember(this.id, member, {'admin': true}, function(){
			gr.allMembersView();
		}, updateError);
	};
	
	Group.prototype.demoteMember = function(admin){
		var gr = this;
		this.userlist[admin].admin = false;
		var tempAdmin = this.admins.indexOf(admin);
		if(tempAdmin!=-1) admin = this.admins.splice(tempAdmin, 1);
		
		if(admin == this.me.userid){
			console.log('Remaking editor since user has demoted himself..');
			gr.editView();
		}
		
		UWAP.groups.updateMember(this.id, admin, {'admin': false}, function(){
			gr.allMembersView();
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
			gr.allMembersView();
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
		this.groupView.find('h4').empty().append(newName);
		UWAP.groups.updateGroup(this.id, {'title': newName}, updateSuccess, updateError);
	};
	
		
	//Adds the group to the list, and handles events.
	Group.prototype.listView = function(){
		var groupView;
		var gr = this;
		var hidden = false;
		
		//Most of the HTML is done in the template
		//groupView = $( $('#listGroup').render(gr) );
		groupView = $( this.templates['listGroup'].render(gr) );
		$('#myGroups').append(groupView);
		
		//Some html added after
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
				gr.removeGroup(groupView, breaks);
			}).appendTo(groupView);
			
		}
		$('<div class="bottomOfGV"></div>').appendTo(groupView);
		var breaks = $('<br /><br /><br />').appendTo('#myGroups');
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
		var mainContainer = $('#mainContainer').hide();
		$('#detailsContainer').remove();
		
		//Append the edit-container, containing most of the html, to body
		//$('body').append( $('#detCont').render(gr) );
		$('body').append( $(this.templates['detCont'].render(gr)) );
		
		$('#groupBack').click(function(){
			$('#detailsContainer').remove();mainContainer.show();
		});
		
		//Puts rows in the members-table
		gr.allMembersView();
//		$('#membersTable').dataTable();
		
		//Adds edit-buttons to title and description if owner or admin
		if(gr.you.admin || gr.you.owner){
			console.log('is owner or admin');
			$(' <a style="margin-left: 10px;" href="javascript:void(0)" class="btn btn-primary btn-mini"> Edit</a>').appendTo('#titleHeader').click(function(){
				gr.makeTitleEditor($('#titleContainer'));
			});
			defaultDescr($('#descriptContainer'), gr);
		}
		
		var check = $('<input type="checkbox"> List publicly and allow subscriptions</input>').appendTo('#checkContainer').click(function(){
			if(gr.you.admin || gr.you.owner){
				gr.setListing($(this).is(':checked'));
			}
			else{
				if($(this).is(':checked')){
					$(this).prop('checked', false);
				}
				else{
					$(this).prop('checked', true);
				}				
			}
		});
		
		if(gr.listable){
			check.attr('checked', true);
		}
		
		
		if(gr.you.admin || gr.you.owner){
			var ps = $("#peoplesearch").focus().peopleSearch({
				callback: function(item) {
		            gr.addMember(item);
		            ps.focus();
		        }
			});
			ps.focus(function(){
				ps.css('border-color', '#DDAA33');
			});
			ps.blur(function(){
				ps.css('border-color', '#DDD');
			});
			ps.focus();
			ps.keyup(function(e){
				if(e.which==27){
					ps.val('');
					ps.keyup();
				}
			});
		}
		$('#groupBack').click( function(){
			$('#searchInput').focus();
		});
		
		$('#brandTitle').click(function(){
			$('#groupBack').click();
		});
	};
	
	//Puts rows in the members-table
	Group.prototype.allMembersView = function() {
		var gr = this;
		$('#allMem').empty();
		$.each(this.admins, function(i,v){
			if(gr.userlist[v]){
				if(gr.you.admin || gr.you.owner){
					console.log('admin+admin');
					$('#allMem').append(
							//$('#allMembers').render(gr.userlist[v], {gr:gr})
							gr.templates['allMembers'].render(gr.userlist[v], {gr:gr})
					);
				}
				else{
					$('#allMem').append(
							//$('#allMembersNormal').render(gr.userlist[v], {gr:gr})
							gr.templates['allMembersNormal'].render(gr.userlist[v], {gr:gr})
					);
				}
			}
		});
		$.each(this.members, function(i,v){
			if(gr.userlist[v] && gr.admins.indexOf(v) == -1){
				if(gr.you.admin || gr.you.owner){
					$('#allMem').append(
							//$('#allMembers').render(gr.userlist[v], {gr:gr})
							gr.templates['allMembers'].render(gr.userlist[v], {gr:gr})
					);
				}
				else{
					$('#allMem').append(
							//$('#allMembersNormal').render(gr.userlist[v], {gr:gr})
							gr.templates['allMembersNormal'].render(gr.userlist[v], {gr:gr})
					);
				}
			}
		});
		$('.removeButton').click(function(){
			var mem = $(this).attr('memid');
			gr.removeMember(mem);
		});
		$('.demoteButton').click(function(){
			var mem = $(this).attr('memid');
			gr.demoteMember(mem);
		});
		$('.promoteButton').click(function(){
			var mem = $(this).attr('memid');
			gr.promoteMember(mem);
		});
	};
	
	Group.prototype.makeTitleEditor = function(titleContainer){
		var gr = this;
		titleContainer.empty();
		var editDiv = $('<div></div>').appendTo(titleContainer);
		var title = $('<input style="font-size:24px;" />').appendTo(editDiv).val(gr.title);
		var sButton = $('<a href="javascript:void(0)" class="btn btn-success">Save</a>').click( function(){
			gr.setName(title.val());
			gr.makeNormalTitle(titleContainer);
		}).appendTo(editDiv);
		title.focus();
		title.keyup(function(e){
			if(e.which==13){
				sButton.click();
			}
		});
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
				var tArea = $('<textarea rows="4" style="width:400px;">'+gr.description+'</textarea>').appendTo(descriptionContainer);
				var saveButton = $('<a href="javascript:void(0)" class="btn btn-success">Save</a>').appendTo(descriptionContainer).click(function(){
					gr.setDescription(tArea.val());
					tArea.remove();
					saveButton.remove();
					$('<span>'+gr.description+'</span>').appendTo(descriptionContainer);
					defaultDescr(descriptionContainer, gr);
				});
				tArea.focus();
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
		 var  groupHandler = function(id){
			 UWAP.groups.get(id, function(d){
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
				 if(d.listable !=undefined){
					 gr.listable = d.listable;
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
						if(v.listing){
							dGroup.listing = v.listing;
						}
						console.log(dGroup);
						myGroups.push(dGroup);
						dGroup.listView();
					}
				});
			}
			
		});
		var search = $('#searchInput').change(function(){console.log('inputChanged')});
		var sCancel = $('#searchCancel').click(function(){search.val(''); search.focus(); console.log('searchCancelled');});
		search.keyup(function(e){
			if(search.val().length > 0){
				sCancel.css("opacity", "1.0");
			}
			else{
				sCancel.css("opacity", "0.6");
			}
			//27 is escape-key
			if(e.which == 27){
				sCancel.click();
			}
		});
		search.focus(function(){
			search.keyup();
		});
		
		var sd = $('#searchDiv');
		search.focus(function(){
			sd.css('border-color', '#DDAA22');
		});
		search.blur(function(){
			sd.css('border-color', '#DDD');
		});
		search.focus();
		
		$('#addOwnGroup').click(function(){
			administerGroup('new');
			$('#newTitle').focus();
		});
		
	}
	
	//Now only does the create group-modal
	function administerGroup(group){
		if(group=='new'){
			$('#myModal').html(
					//$('#createGroupModal').render()
					otherTemplates['createGroupModal'].render()
			);
			$('#saveChanges').click(function(){
				if($('#newTitle').prop('value') != ''){
					UWAP.groups.addGroup({ title: $('#newTitle').prop('value'), description: $('#newDescription').prop('value'), listable : $('#newListing').prop('checked')},
						function(d){
					var dGroup;
					if(d.description){
						dGroup = new Group(d.id, d.title, d.you.admin, d.you.member, d.you.owner, true, d.description);	
					}
					else{
						dGroup = new Group(d.id, d.title, d.you.admin, d.you.member, d.you.owner, true);
					}
					if(d.listable !=undefined){
						dGroup.listable = d.listable;
					}
					myGroups.push(dGroup);
					dGroup.listView();
					}, errorCatch);
					$('#myModal').modal('toggle');
					document.location.href='https://groupmanager.uwap.org/#';
				}
				else{
					alert('Cannot create a group without a title.');
					$('#newTitle').focus();
				}
			});
		}
		$('#myModal').modal('show');
	}
	function errorCatch(err){
		console.log(err);
	}	
});