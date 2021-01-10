.DATA	0x0
a:	.word 0x0
.TEXT	0x0
func:
	addiu	$sp, $sp, -48
	sw	$s0, 16($sp)
	sw	$s1, 20($sp)
	sw	$s2, 24($sp)
	sw	$s3, 28($sp)
	sw	$s4, 32($sp)
	sw	$s5, 36($sp)
	sw	$s6, 40($sp)
	sw	$s7, 44($sp)
	sw	$a0, 48($sp)
	sw	$a1, 52($sp)
	lw	$t0, 48($sp)
	lw	$t1, 52($sp)
	div	$t0, $t1
	mflo	$t2
	sw	$t2, 4($sp)
	lw	$s0, 16($sp)
	lw	$s1, 20($sp)
	lw	$s2, 24($sp)
	lw	$s3, 28($sp)
	lw	$s4, 32($sp)
	lw	$s5, 36($sp)
	lw	$s6, 40($sp)
	lw	$s7, 44($sp)
	addiu	$sp, $sp, 48
	jr	$ra
foo:
	addiu	$sp, $sp, -40
	sw	$s0, 8($sp)
	sw	$s1, 12($sp)
	sw	$s2, 16($sp)
	sw	$s3, 20($sp)
	sw	$s4, 24($sp)
	sw	$s5, 28($sp)
	sw	$s6, 32($sp)
	sw	$s7, 36($sp)
	sw	$a0, 40($sp)
	addiu	$t0, $zero, 2
	move	$v0, $t0
	lw	$s0, 8($sp)
	lw	$s1, 12($sp)
	lw	$s2, 16($sp)
	lw	$s3, 20($sp)
	lw	$s4, 24($sp)
	lw	$s5, 28($sp)
	lw	$s6, 32($sp)
	lw	$s7, 36($sp)
	addiu	$sp, $sp, 40
	jr	$ra
main:
	addiu	$sp, $sp, -64
	sw	$ra, 60($sp)
	sw	$s0, 32($sp)
	sw	$s1, 36($sp)
	sw	$s2, 40($sp)
	sw	$s3, 44($sp)
	sw	$s4, 48($sp)
	sw	$s5, 52($sp)
	sw	$s6, 56($sp)
	sw	$s7, 60($sp)
	addiu	$t0, $zero, 10
	addiu	$t1, $zero, 20
	sw	$t0, 16($sp)
	sw	$t1, 20($sp)
_label_6_loop:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	slt	$t2, $t1, $t0
	beq	$t2, $zero, _label_7_break
	nop
	addiu	$t0, $zero, 15
	addiu	$t1, $zero, 0x00
	addiu	$t2, $zero, 1
	sw	_var_13, $t2
	sw	$t0, 16($sp)
_label_8_loop:
	addiu	$t0, $zero, 1
	lw	$t1, 16($sp)
	sub	$t2, $t1, $t0
	nor	$t2, $t1, $t0
	beq	$t2, $zero, _label_9_break
	nop
	addiu	$t0, $zero, 2
	lw	$t1, 20($sp)
	mult	$t1, $t0
	mflo	$t2
	sw	$t2, 20($sp)
	move	$a0, $t2
	jal	foo
	lw	$a0, 20($sp)
	jal	foo
	move	$t0, $v0
	sw	$t0, 16($sp)
	j	_label_9_break
	nop
	j	_label_8_loop
	nop
_label_9_break:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	slt	$t2, $t1, $t0
_label_10_true:
	beq	$t2, $zero, _label_11_false
	nop
	lw	$t0, 20($sp)
	lw	$t1, 16($sp)
	add	$t2, $t0, $t1
	sw	$t2, 20($sp)
	j	_label_6_loop
	nop
_label_11_false:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	slt	$t2, $t0, $t1
_label_12_true:
	beq	$t2, $zero, _label_13_false
	nop
	j	_label_7_break
	nop
_label_13_false:
	lw	$t0, 16($sp)
	lw	$t1, 20($sp)
	xor	$t2, $t0, $t1
	xor	$t3, $zero, $t2
	or	$t4, $t3, $t1
	sw	$t4, 16($sp)
	j	_label_6_loop
	nop
_label_7_break:
	addiu	$t0, $zero, 0
	move	$v0, $t0
	lw	$s0, 32($sp)
	lw	$s1, 36($sp)
	lw	$s2, 40($sp)
	lw	$s3, 44($sp)
	lw	$s4, 48($sp)
	lw	$s5, 52($sp)
	lw	$s6, 56($sp)
	lw	$s7, 60($sp)
	lw	$ra, 60($sp)
	addiu	$sp, $sp, 64
	jr	$ra