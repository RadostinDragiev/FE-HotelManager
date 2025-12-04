(function ($) {
      const header = $('header');
      const mobileNav = $('.mobile-nav');
      const toggle = $('.menu-toggle');
      
      // Sticky header shrink
      function onScroll() {
        if ($(window).scrollTop() > 40) header.addClass('scrolled');
        else header.removeClass('scrolled');
      }
      $(window).on('scroll', onScroll);
      onScroll();
      
      // Mobile nav toggle
      toggle.on('click', function () {
        const isHidden = mobileNav.is('[hidden]');
        mobileNav.attr('hidden', !isHidden);
        $(this).find('i').toggleClass('fa-bars fa-xmark');
      });
      mobileNav.find('a').on('click', () => mobileNav.attr('hidden', true));
      
      // Smooth scroll
      $('a[href^="#"]').on('click', function (e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
          e.preventDefault();
          $('html, body').animate({ scrollTop: target.offset().top - 80 }, 600);
        }
      });
      
      // Testimonials slider
      const slides = $('[data-slider] .testimonial');
      let index = 0;
      function rotate() {
        slides.removeClass('is-active').css('opacity', 0.4);
        slides.eq(index).addClass('is-active').css('opacity', 1);
        index = (index + 1) % slides.length;
      }
      setInterval(rotate, 4200);
      rotate();
      
      // Demo booking submission
      $('#bookingForm').on('submit', function (e) {
        e.preventDefault();
        const params = new URLSearchParams({
          checkin: $('#checkin').val(),
          checkout: $('#checkout').val(),
          guests: $('#guests').val(),
          rooms: $('#rooms').val()
        });
        window.location.href = `/check-availability.html?${params.toString()}`;
      });
    })(jQuery);
