$(document).ready(function() {

// Add new option input focus set to "false" by default
var option_focus = false;

/**
 * When new option text input (our color and text fields) gets and loses focus
 */
$('.vwm_polls_new_option input[type="text"]').live('focusin focusout', function(e) {
	e.type == 'focusin' ? option_focus = true : option_focus = false;
});

/**
 * When the publish form is subitted
 */
$('#publishForm').submit(function(e) {
	// If our a option text or color input has focus
	if (option_focus) {
		// Stop the form submission (so we can add this poll option)
		e.preventDefault();
	}
});

/**
 * On keyup inside a new poll option text input
 */
$('.vwm_polls_new_option input[type="text"]').live('keyup', function(e) {
	// If the use pressed the "enter" key
	if (e.which == 13) {
		add_option( $(this).closest('tfoot') );
	}
});

/**
 * When the "add new poll option" button is clicked
 */
$('input[type="button"].vwm_polls_new_option').live('click', function() {
	add_option( $(this).closest('tfoot') );
});

/**
 * Make poll options sortable!
 */
var make_sortable = function make_sortable() {
	// Select poll options table tbody
	$('body').find('table[id^="vwm_polls_options"] > tbody').sortable({
		axis: 'y',
		handle: 'td.drag',
		containment: 'parent',
		update: function() {

			// Grab entry ID
			var entry_id = $('#publishForm input[name="entry_id"]').val();

			var options = [];

			/**
			 * If this is an existing entry
			 *
			 * @todo delay the ordering until after the "Submit" button is
			 * pressed. Ordering these on-the-fly is kinda sketch.
			 */
			if (entry_id > 0)
			{
				options = $(this).find('input[id^="vwm_polls_option"]');
				var obj = new Object();

				$(options).each(function(i, option) {
					var id = $(option).attr('id');
					id = parseInt( id.replace('vwm_polls_option_', '') );
					obj[id] = i;
				});

				$.post(EE.CP_URL + '?D=cp&C=addons_modules&M=show_module_cp&module=vwm_polls&method=ajax_update_order', {
					XID: EE.XID,
					options: obj
				});
			}
			// If this is a new entry (these are new poll options)
			else
			{
				options = $(this).children('tr');
				var field_id = $(this).closest('table').find('input[name="vwm_polls_field_id"]').val();

				// Loop through all of our new poll options and update each one to reflect their new order
				$(options).each(function(i, option) {
					var color = $(option).find('input[name*="color"]');
					var type = $(option).find('select[name*="type"]');
					var text = $(option).find('input[name*="text"]');

					$(this).attr('class', 'option_' + i);
					$(color).attr('name', 'vwm_polls_new_options[' + field_id + '][' + i + '][color]');
					$(type).attr('name', 'vwm_polls_new_options[' + field_id + '][' + i + '][type]');
					$(text).attr('name', 'vwm_polls_new_options[' + field_id + '][' + i + '][text]');
				});
			}
		}
	});

	return make_sortable;
}();

/**
 * Add a poll option
 *
 * @param object		Table row of our new option
 */
function add_option(new_option) {

	// Options table info
	var options_table = $(new_option).closest('table');
	var options_tbody = $(options_table).children('tbody');
	var options_table_id = $(options_table).attr('id');

	// IDs
	var entry_id = $('#publishForm input[name="entry_id"]').val();
	var field_id = $(new_option).find('input[name="vwm_polls_field_id"]').val();

	// Option data
	var text = $(new_option).find('input[name="vwm_polls_new_option_text"]').val().replace(/^\s+|\s+$/g,''); // Trim of whitespace
	var type = $(new_option).find('select[name="vwm_polls_new_option_type"]').val();
	var color = $(new_option).find('input[name="vwm_polls_new_option_color"]').val();

	// If the user just entered whitespace
	if (text == '') {
		return;
	}

	// If this is an existing entry
	if (entry_id > 0) {
		$.post(EE.BASE + '&C=addons_modules&M=show_module_cp&module=vwm_polls&method=ajax_add_option', {
				XID: EE.XID, // XID
				text: text, // Option text
				type: type, // Option type
				color: color, // Option color
				order: $(options_tbody).children('tr').length, // Our order is index 0 so we don't need to +1
				entry_id: entry_id, // Entry ID
				field_id: field_id // Field ID
			}, function(data) {

				// Ajax load some new options up in here!
				$(options_table).load(window.location.href + ' #' + options_table_id + ' > *');

				// Clear text input
				$(new_option).find('input[name="vwm_polls_new_option_text"]').val('');
		}, 'json');
	}
	// If this is a new entry
	else {

		// Get the index of our new option
		var option_index = $(options_tbody).children('tr').length ? $(options_tbody).children('tr').length : 0;

		// Generate new input name attributes
		var color_name = 'vwm_polls_new_options[' + field_id + '][' + option_index + '][color]';
		var type_name = 'vwm_polls_new_options[' + field_id + '][' + option_index + '][type]';
		var text_name = 'vwm_polls_new_options[' + field_id + '][' + option_index + '][text]';

		// Clone last table row
		var clone = $(new_option).children('tr').clone();
		$(clone).find('td:first').empty();
		$(clone).attr('class', 'option_' + option_index);
		$(clone).find(':input[name*="color"]').attr('name', color_name);
		$(clone).find(':input[name*="type"]').attr('name', type_name);
		$(clone).find(':input[name*="text"]').attr('name', text_name);

		// Insert new table row
		$(options_tbody).append(clone);

		// Update data
		var new_row = $(options_tbody).children('tr:last');
		$(new_row).find('input[name*="text"]').val(text);
		$(new_row).find('input[name*="color"]').val(color);
		$(new_row).find('select[name*="type"]').val(type);

		// Clear text input
		$(new_option).find('input[name="vwm_polls_new_option_text"]').val('');

		// Cleanup as if this was an Ajax request
		ajaxCleanup();
	}
}

// Tabs on publish page
$('div[id^="vwm_polls_tabs"]').tabs();

// Poll "other" votes
$('table.vwm_polls_results ul').hide();
$('table.vwm_polls_results a').click(function() {
	$(this).siblings('ul').slideToggle('slow');
});

// Toggle min & max poll options
(function() {
	// Min & max inputs
	var min = $('#multiple_options_min');
	var max = $('#multiple_options_max');

	// Multiple option select input
	var multiple_options = $('#multiple_options');

	// Hide and reset min & max inputs
	function hide_min_max() {
		$(min).val(0).closest('tr').hide();
		$(max).val(0).closest('tr').hide();
	}

	// Show min and max inputs
	function show_min_max() {
		$(min).closest('tr').show();
		$(max).closest('tr').show();
	}

	// On page load, if multiple options are disabled, hide min and max inputs
	if ( $(multiple_options).val() == 0 ) {
		hide_min_max()
	}

	// When the multiple option select input is changed
	$(multiple_options).change(function() {
		if ( $(this).val() == 1 ) {
			show_min_max();
		}
		else {
			hide_min_max();
		}
	});

})();


/**
 * jQuery Pill plugin
 */
$.fn.pill = function() {
	this.each(function() {
			var pill = $(this);
			var radios = $(pill).find('input[type="radio"]');

			// Add "checked" class on plugin load
			$(radios).filter(':checked').closest('div').addClass('checked');

			// Toggle on radio change
			$(radios).live('change', function() {
				var parent = $(this).closest('div');
				var siblings = $(parent).siblings('div');
				$(siblings).removeClass('checked');
				$(this).closest('div').addClass('checked');
			});
		});

	return this;
}

/**
 * Get our pills runnin'
 */
var pill = function pill() {
	$('body').find('.pill').pill();
	return pill;
}();

/**
 * Crayon Picker
 */
var crayonpicker = function crayonpicker() {
	$('body').find('#publishForm td.color input[type="text"]').crayonpicker({
		onChange: function(target, trigger, color) {
			$(target).css('background-color', color);
		}
	});
	return crayonpicker;
}();

/**
 * Run cleanup function on Ajax complete!
 */
$('body').ajaxComplete(function() {
	ajaxCleanup();
});

/**
 * Run Ajax cleanup functions!
 */
var ajaxCleanup = function ajaxCleanup() {
	// Run cleanup functions
	pill();
	crayonpicker();
	make_sortable();

	return ajaxCleanup;
}

});