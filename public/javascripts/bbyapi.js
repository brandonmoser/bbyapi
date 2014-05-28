$(document).ready(function(){
	$('.pagination a').click(function(){
		var form = $(this).closest('form');
		$.post(form.attr('action'), form.serialize(), function(data) {
			$('#content', this).html(data);
		});
		return false;
	};
};
