import $ from 'jquery';
import Modal from './vendor/modal';
import FastClick from 'fastclick';
import fb from 'fancybox';
fb($);

$(document)
    .on('click', '.mmodal', e => {
        e.preventDefault();
        let m = new Modal({
            width: 750
        });
        m.url(e.target.getAttribute('href'));
    });

$(() => {
    FastClick.attach(document.body);
    $("a[href$='.jpg'],a[href$='.png'],a[href$='.gif']").attr('rel', 'gallery').fancybox({
        margin: [40, 0, 40, 0]
    });
});