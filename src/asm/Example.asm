.DATA	0x0
a:	.word 0x0
.TEXT	0x0
func:			# vars = 1, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -8
	sw	$a0, 8($sp)
	sw	$a1, 12($sp)
	lw	$t0, 8($sp)
	lw	$t1, 12($sp)
	div	$t0, $t1
	mflo	$t2
	sw	$t2, 4($sp)
	addiu	$sp, $sp, 8
	jr	$ra
foo:			# vars = 0, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -0
	sw	$a0, 0($sp)
	addiu	$t0, $zero, 2
	move	$v0, $t0
	addiu	$sp, $sp, 0
	jr	$ra
main:			# vars = 3, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -32
	sw	$ra, 28($sp)
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
	sw	$t2, 0($t1)
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
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra